import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeploymentStatus, ErrorSource, Project } from '@prisma/client';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { EMPTY, Observable, Subject, merge, of } from 'rxjs';
import { simpleGit } from 'simple-git';
import { ActivityService } from '../activity/activity.service';
import { EnvVarsService } from '../env-vars/env-vars.service';
import { ErrorLogService } from '../error-log/error-log.service';
import { ThumbnailService } from '../gallery/thumbnail.service';
import { GithubService } from '../github/github.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';
import { DockerBuildService } from './docker-build.service';

export type StatusEvent =
  | { type: 'status'; deploymentId: string; status: DeploymentStatus }
  | { type: 'log'; deploymentId: string; chunk: string };

// Only the release `current` points to is kept — no rollback history for now,
// to keep disk usage flat regardless of deploy frequency. Bump this once storage
// is cheap enough to afford keeping a few past releases around.
const RELEASES_TO_KEEP = 1;

// XP paid on every successful deploy, plus a one-time onboarding bonus for a
// user's very first one — see awardDeployXp.
const DEPLOY_XP = 10;
const FIRST_DEPLOY_BONUS_XP = 50;

type ProjectPaths = {
  root: string;
  repo: string;
  releases: string;
  current: string;
};

type QueuedDeploy = {
  project: Project;
  deploymentId: string;
  installationId: bigint | null;
  options?: { targetSha?: string; commitSha?: string; commitMessage?: string; triggeredBy?: string };
};

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);
  private readonly projectsRoot: string;
  // One Subject per in-flight project. Completed and removed when the
  // deployment reaches a terminal state (SUCCESS or FAILED).
  private readonly streams = new Map<string, Subject<StatusEvent>>();
  // Deploys waiting for a free slot. Bounded by BUILD_QUEUE_DEPTH.
  private readonly buildQueue: QueuedDeploy[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly errorLog: ErrorLogService,
    private readonly notifications: NotificationsService,
    private readonly thumbnails: ThumbnailService,
    private readonly dockerBuild: DockerBuildService,
    private readonly github: GithubService,
    private readonly envVars: EnvVarsService,
    private readonly activity: ActivityService,
    private readonly projects: ProjectsService,
  ) {
    this.projectsRoot = path.resolve(this.config.get<string>('PROJECTS_ROOT', './data/projects'));
  }

  async findByIdForUser(id: string, userId: string) {
    const deployment = await this.prisma.deployment.findFirst({
      // Membership, not ownership — same boundary as ProjectsService.findForMember.
      where: { id, project: { members: { some: { user_id: userId } } } },
    });
    if (!deployment) {
      throw new NotFoundException(`deployment "${id}" not found`);
    }
    return deployment;
  }

  // Unscoped by design — only AdminController may call this.
  async findById(id: string) {
    const deployment = await this.prisma.deployment.findUnique({ where: { id } });
    if (!deployment) {
      throw new NotFoundException(`deployment "${id}" not found`);
    }
    return deployment;
  }

  // SSE clients subscribe here. Always emits the latest deployment status from
  // the DB first (so a late-connecting client catches up), then streams live
  // updates until the deployment reaches a terminal state.
  async watchProject(projectId: string): Promise<Observable<StatusEvent>> {
    const latest = await this.prisma.deployment.findFirst({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
      select: { id: true, status: true },
    });

    const initial$ = latest ? of({ type: 'status' as const, deploymentId: latest.id, status: latest.status }) : EMPTY;
    const live$ = this.streams.get(projectId)?.asObservable() ?? EMPTY;
    return merge(initial$, live$);
  }

  async trigger(
    project: Project,
    options?: { targetSha?: string; installationId?: bigint; commitSha?: string; commitMessage?: string; triggeredBy?: string },
  ) {
    if (this.streams.has(project.id) || this.buildQueue.some((q) => q.project.id === project.id)) {
      throw new ConflictException(`project "${project.slug}" already has a deploy in progress`);
    }

    // Prefer installation ID from webhook payload (no DB round-trip needed);
    // fall back to the user's first connected GitHub account for manual deploys.
    const installationId =
      options?.installationId ??
      (await this.prisma.githubAccount.findFirst({ where: { user_id: project.user_id } }))
        ?.installation_id ??
      null;

    const maxConcurrent = this.config.get<number>('BUILD_MAX_CONCURRENT', 3);
    const queued = this.streams.size >= maxConcurrent;

    if (queued) {
      const maxQueueDepth = this.config.get<number>('BUILD_QUEUE_DEPTH', 10);
      if (this.buildQueue.length >= maxQueueDepth) {
        throw new ConflictException('build queue is full, try again later');
      }
    }

    const deployment = await this.prisma.deployment.create({
      data: { project_id: project.id, status: queued ? DeploymentStatus.QUEUED : DeploymentStatus.PENDING },
    });

    this.activity.record({ project_id: project.id, type: 'DEPLOY_TRIGGERED', actor_id: options?.triggeredBy, payload: { deployment_id: deployment.id } });

    // Subject is created here for both paths so that watchProject() always finds
    // a live$ for in-flight deployments — including ones waiting in the queue.
    // Without this, a QUEUED deployment has no subject in streams, watchProject
    // returns EMPTY as live$, and the SSE connection closes before the pipeline
    // even starts.
    this.streams.set(project.id, new Subject<StatusEvent>());

    if (queued) {
      this.buildQueue.push({ project, deploymentId: deployment.id, installationId, options });
      this.logger.log(`[${project.slug}] queued (position ${this.buildQueue.length})`);
    } else {
      this.startPipeline(project, deployment.id, installationId, options);
    }

    return deployment;
  }

  private startPipeline(
    project: Project,
    deploymentId: string,
    installationId: bigint | null,
    options?: { targetSha?: string; commitSha?: string; commitMessage?: string; triggeredBy?: string },
  ) {
    // Subject already created in trigger() — reuse it so SSE clients that
    // connected while the deploy was QUEUED keep receiving events.

    // Fire-and-forget: return the PENDING row immediately, the pipeline updates
    // its own row as it progresses instead of holding the HTTP request open.
    // This outer .catch() is defense-in-depth for a bug in runPipeline itself
    // (which already self-guards its whole body) — an unexpected platform
    // failure, not an ordinary build failure, so it goes through ErrorLog too.
    void this.runPipeline(project, deploymentId, installationId, options).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`deployment ${deploymentId} crashed outside pipeline guard`, stack);
      void this.errorLog.record({
        message,
        stack,
        source: ErrorSource.DEPLOY_PIPELINE,
        user_id: project.user_id,
      });
      void this.notifications.notifyAdmins({
        title: 'Mollire: pipeline de deploy quebrou',
        body: `${project.slug}: ${message}`,
      });
    });
  }

  private async runPipeline(
    project: Project,
    deploymentId: string,
    installationId: bigint | null,
    options?: { targetSha?: string; commitSha?: string; commitMessage?: string; triggeredBy?: string },
  ) {
    const paths = this.projectPaths(project.slug);
    const buildOutputPath = path.join(paths.root, 'build-output');
    let log = '';
    const appendLog = (chunk: string) => {
      log += chunk;
      this.streams.get(project.id)?.next({ type: 'log', deploymentId, chunk });
    };

    let githubDeploymentId: number | null = null;

    try {
      await fs.mkdir(paths.root, { recursive: true });

      await this.setStatus(deploymentId, project.id, DeploymentStatus.CLONING);
      const cloneStart = Date.now();
      const clonedSha = await this.cloneRepo(project.repository_url, paths.repo, appendLog, installationId, options?.targetSha);
      const commitSha = options?.commitSha ?? clonedSha;
      this.logger.log(`[${project.slug}] clone: ${((Date.now() - cloneStart) / 1000).toFixed(1)}s`);

      // The folder was checked when it was saved, but the repo may have changed
      // since (or it was "unverified" then). Fail here, clearly, rather than as
      // an obscure container error further down.
      await this.assertRootDirExists(paths.repo, project.root_dir);

      if (installationId) {
        try {
          githubDeploymentId = await this.github.createDeployment(installationId, project.repository_url, commitSha);
          await this.github.setDeploymentStatus(installationId, project.repository_url, githubDeploymentId, 'in_progress');
        } catch (err) {
          this.logger.warn(`[${project.slug}] failed to create GitHub deployment: ${err instanceof Error ? err.message : err}`);
        }
      }

      await this.setStatus(deploymentId, project.id, DeploymentStatus.BUILDING);
      const buildStart = Date.now();
      const projectEnvVars = await this.envVars.getDecrypted(project.id);
      await this.runBuild(project.root_dir, project.build_command, paths.repo, project.output_dir, buildOutputPath, appendLog, projectEnvVars);
      this.logger.log(`[${project.slug}] build: ${((Date.now() - buildStart) / 1000).toFixed(1)}s`);

      await this.setStatus(deploymentId, project.id, DeploymentStatus.PUBLISHING);
      const releasePath = await this.publish(paths, buildOutputPath);

      // Counts prior successes before this deployment's own row flips to
      // SUCCESS below, so the first-ever-deploy bonus reads correctly.
      await this.awardDeployXp(project);

      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.SUCCESS,
          commit_sha: commitSha,
          commit_message: options?.commitMessage ?? null,
          release_path: releasePath,
          log,
          finished_at: new Date(),
        },
      });
      this.activity.record({
        project_id: project.id,
        type: 'DEPLOY_SUCCESS',
        actor_id: options?.triggeredBy,
        payload: { deployment_id: deploymentId, commit_sha: commitSha ?? null, commit_message: options?.commitMessage ?? null },
      });
      this.emitTerminal(project.id, deploymentId, DeploymentStatus.SUCCESS);

      if (installationId && githubDeploymentId !== null) {
        const appUrl = this.config.get<string>('APP_URL', '');
        const environmentUrl = appUrl ? `${appUrl}/${project.slug}` : undefined;
        try {
          await this.github.setDeploymentStatus(installationId, project.repository_url, githubDeploymentId, 'success', environmentUrl);
        } catch (err) {
          this.logger.warn(`[${project.slug}] failed to update GitHub deployment status: ${err instanceof Error ? err.message : err}`);
        }
      }

      await this.pruneOldReleases(paths.releases);

      if (project.is_public) {
        await this.thumbnails.capture(project, deploymentId, releasePath);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const message = raw.replace(/x-access-token:[^@]+@/g, 'x-access-token:[REDACTED]@');
      appendLog(`\nFAILED: ${message}`);
      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.FAILED, log, finished_at: new Date() },
      });
      this.activity.record({ project_id: project.id, type: 'DEPLOY_FAILED', actor_id: options?.triggeredBy, payload: { deployment_id: deploymentId } });
      this.emitTerminal(project.id, deploymentId, DeploymentStatus.FAILED);

      if (installationId && githubDeploymentId !== null) {
        try {
          await this.github.setDeploymentStatus(installationId, project.repository_url, githubDeploymentId, 'failure');
        } catch (ghErr) {
          this.logger.warn(`[${project.slug}] failed to update GitHub deployment status: ${ghErr instanceof Error ? ghErr.message : ghErr}`);
        }
      }

      // Deploy failures are the tenant's own build breaking, not a Mollire bug —
      // notify the owner, not the admin, and don't write an ErrorLog row (that's
      // reserved for unexpected platform errors; this is already fully captured
      // by Deployment.status=FAILED + .log above).
      void this.notifications.notifyTenant(project.user_id, {
        title: `Deploy falhou: ${project.name}`,
        body: message,
      });
    } finally {
      await fs.rm(buildOutputPath, { recursive: true, force: true });
    }
  }

  // Permanently removes a project: the row (everything hanging off it cascades),
  // then what it left on disk — the checkout, the releases and the live
  // `current` that Nginx serves, plus the gallery thumbnail. Refuses while a
  // deploy is running or queued, since that pipeline would be writing into the
  // directory being deleted. The row goes first: if the file cleanup then fails
  // the project is already gone for the user, and only orphaned files remain.
  async removeProject(project: Project) {
    if (this.streams.has(project.id) || this.buildQueue.some((q) => q.project.id === project.id)) {
      throw new ConflictException(`project "${project.slug}" has a deploy in progress, wait for it to finish`);
    }

    await this.projects.remove(project.id);

    const { root } = this.projectPaths(project.slug);
    // Slugs are DNS labels, so this can't escape projectsRoot; checked anyway
    // because the next line is a recursive delete.
    if (root.startsWith(this.projectsRoot + path.sep)) {
      await fs.rm(root, { recursive: true, force: true }).catch((err) => {
        this.logger.warn(`[${project.slug}] could not remove ${root}: ${err instanceof Error ? err.message : err}`);
      });
    }
    await this.thumbnails.remove(project.thumbnail_url);
  }

  private projectPaths(slug: string): ProjectPaths {
    const root = path.join(this.projectsRoot, slug);
    return {
      root,
      repo: path.join(root, 'repo'),
      releases: path.join(root, 'releases'),
      current: path.join(root, 'current'),
    };
  }

  private async cloneRepo(
    repositoryUrl: string,
    repoPath: string,
    log: (chunk: string) => void,
    installationId: bigint | null,
    targetSha?: string,
  ) {
    const cloneUrl =
      installationId !== null
        ? await this.github.authenticatedCloneUrl(repositoryUrl, installationId)
        : repositoryUrl;

    // Block timeout per git operation — prevents a slow/stalled remote from
    // holding a build slot indefinitely. BUILD_TIMEOUT_MS covers Docker only.
    const cloneTimeoutMs = this.config.get<number>('CLONE_TIMEOUT_MS', 120_000);
    const gitOpts = { timeout: { block: cloneTimeoutMs } };

    const hasRepo = await fs
      .access(path.join(repoPath, '.git'))
      .then(() => true)
      .catch(() => false);

    if (hasRepo) {
      log(`fetching ${repositoryUrl}\n`);
      try {
        const git = simpleGit(repoPath, gitOpts);
        await git.remote(['set-url', 'origin', cloneUrl]);
        await git.fetch(['--depth', '1', 'origin']);
        await git.reset(['--hard', 'FETCH_HEAD']);
        await git.raw(['clean', '-fd', '-e', 'node_modules']);
      } catch {
        log(`fetch failed, falling back to fresh clone\n`);
        await fs.rm(repoPath, { recursive: true, force: true });
        await simpleGit(gitOpts).clone(cloneUrl, repoPath, ['--depth', '1']);
      }
    } else {
      log(`cloning ${repositoryUrl}\n`);
      await simpleGit(gitOpts).clone(cloneUrl, repoPath, ['--depth', '1']);
    }

    const git = simpleGit(repoPath, gitOpts);

    // Remove the token from .git/config before the build container mounts this directory.
    await git.remote(['set-url', 'origin', repositoryUrl]);

    if (targetSha) {
      const currentHead = (await git.revparse(['HEAD'])).trim();
      if (!currentHead.startsWith(targetSha) && !targetSha.startsWith(currentHead)) {
        log(`fetching commit ${targetSha}\n`);
        await git.remote(['set-url', 'origin', cloneUrl]);
        await git.fetch(['origin', targetSha, '--depth', '1']);
        await git.remote(['set-url', 'origin', repositoryUrl]);
        await git.checkout([targetSha]);
        await git.raw(['clean', '-fd', '-e', 'node_modules']);
      }
    }

    const sha = await git.revparse(['HEAD']);
    return sha.trim();
  }

  private async assertRootDirExists(repoPath: string, rootDir: string) {
    if (!rootDir) return;
    const isDir = await fs
      .stat(path.join(repoPath, rootDir))
      .then((stat) => stat.isDirectory())
      .catch(() => false);
    if (!isDir) {
      throw new Error(`root_dir "${rootDir}" was not found in the repository — fix the project's folder in its settings`);
    }
  }

  private async runBuild(
    rootDir: string,
    buildCommand: string,
    repoPath: string,
    outputDir: string,
    outputHostPath: string,
    log: (chunk: string) => void,
    envVars: Record<string, string> = {},
  ) {
    await this.dockerBuild.run(repoPath, rootDir, buildCommand, outputDir, outputHostPath, log, envVars);
  }

  private async publish(paths: ProjectPaths, builtDir: string) {
    const releaseId = new Date().toISOString().replace(/[:.]/g, '-');
    const releasePath = path.join(paths.releases, releaseId);

    await fs.mkdir(paths.releases, { recursive: true });
    await fs.cp(builtDir, releasePath, { recursive: true });

    // Atomic swap on POSIX: symlink a temp name then rename() over `current` —
    // rename() is atomic, so Nginx never sees a half-swapped dir.
    // On Windows without symlink privilege (EPERM), fall back to a plain copy
    // into `current` — non-atomic but fine for local dev.
    // EXDEV means tempLink and current are on different filesystems — that should
    // never happen because both live under the same PROJECTS_ROOT, but if it does
    // (misconfigured mount), surface a clear error rather than silently falling
    // back to a copy that would also fail.
    try {
      const tempLink = `${paths.current}.tmp-${releaseId}`;
      await fs.symlink(releasePath, tempLink, 'dir');
      try {
        await fs.rename(tempLink, paths.current);
      } catch (renameErr: unknown) {
        const code = (renameErr as NodeJS.ErrnoException).code;
        if (code === 'EXDEV') {
          await fs.rm(tempLink, { force: true });
          throw new Error(
            `EXDEV: cannot rename symlink across filesystems — ensure PROJECTS_ROOT (${this.projectsRoot}) is on a single mount point`,
          );
        }
        await fs.rm(paths.current, { recursive: true, force: true });
        await fs.rename(tempLink, paths.current);
      }
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code !== 'EPERM') throw err;
      await fs.rm(paths.current, { recursive: true, force: true });
      await fs.cp(releasePath, paths.current, { recursive: true });
    }

    return releasePath;
  }

  private async pruneOldReleases(releasesDir: string) {
    const entries = await fs.readdir(releasesDir);
    const stale = entries.sort().reverse().slice(RELEASES_TO_KEEP);
    await Promise.all(
      stale.map((entry) => fs.rm(path.join(releasesDir, entry), { recursive: true, force: true })),
    );
  }

  private async setStatus(deploymentId: string, projectId: string, status: DeploymentStatus) {
    await this.prisma.deployment.update({ where: { id: deploymentId }, data: { status } });
    this.streams.get(projectId)?.next({ type: 'status', deploymentId, status });
  }

  // Called after the DB update that writes the full terminal row (log, sha…),
  // so SSE clients that reload on this event see the complete data.
  private emitTerminal(projectId: string, deploymentId: string, status: DeploymentStatus) {
    const subject = this.streams.get(projectId);
    if (subject) {
      subject.next({ type: 'status', deploymentId, status });
      subject.complete();
      this.streams.delete(projectId);
    }

    const next = this.buildQueue.shift();
    if (next) {
      this.logger.log(`[${next.project.slug}] dequeued (${this.buildQueue.length} remaining)`);
      this.startPipeline(next.project, next.deploymentId, next.installationId, next.options);
    }
  }

  private async awardDeployXp(project: Project): Promise<void> {
    const priorSuccesses = await this.prisma.deployment.count({
      where: { project: { user_id: project.user_id }, status: DeploymentStatus.SUCCESS },
    });
    const xp = DEPLOY_XP + (priorSuccesses === 0 ? FIRST_DEPLOY_BONUS_XP : 0);
    await this.prisma.user.update({ where: { id: project.user_id }, data: { xp: { increment: xp } } });
  }
}
