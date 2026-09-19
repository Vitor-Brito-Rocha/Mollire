import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeploymentStatus, ErrorSource, Project } from '@prisma/client';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { simpleGit } from 'simple-git';
import { ErrorLogService } from '../error-log/error-log.service';
import { ThumbnailService } from '../gallery/thumbnail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { DockerBuildService } from './docker-build.service';

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

@Injectable()
export class DeploymentsService {
  private readonly logger = new Logger(DeploymentsService.name);
  private readonly projectsRoot: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly errorLog: ErrorLogService,
    private readonly notifications: NotificationsService,
    private readonly thumbnails: ThumbnailService,
    private readonly dockerBuild: DockerBuildService,
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

  async trigger(project: Project) {
    const deployment = await this.prisma.deployment.create({
      data: { project_id: project.id, status: DeploymentStatus.PENDING },
    });

    // Fire-and-forget: return the PENDING row immediately, the pipeline updates
    // its own row as it progresses instead of holding the HTTP request open.
    // This outer .catch() is defense-in-depth for a bug in runPipeline itself
    // (which already self-guards its whole body) — an unexpected platform
    // failure, not an ordinary build failure, so it goes through ErrorLog too.
    void this.runPipeline(project, deployment.id).catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`deployment ${deployment.id} crashed outside pipeline guard`, stack);
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

    return deployment;
  }

  private async runPipeline(project: Project, deploymentId: string) {
    const paths = this.projectPaths(project.slug);
    const buildOutputPath = path.join(paths.root, 'build-output');
    let log = '';
    const appendLog = (chunk: string) => {
      log += chunk;
    };

    try {
      await fs.mkdir(paths.root, { recursive: true });

      await this.setStatus(deploymentId, DeploymentStatus.CLONING);
      const commitSha = await this.cloneRepo(project.repository_url, paths.repo, appendLog);

      await this.setStatus(deploymentId, DeploymentStatus.BUILDING);
      await this.runBuild(project.build_command, paths.repo, project.output_dir, buildOutputPath, appendLog);

      await this.setStatus(deploymentId, DeploymentStatus.PUBLISHING);
      const releasePath = await this.publish(paths, buildOutputPath);

      // Counts prior successes before this deployment's own row flips to
      // SUCCESS below, so the first-ever-deploy bonus reads correctly.
      await this.awardDeployXp(project);

      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: DeploymentStatus.SUCCESS,
          commit_sha: commitSha,
          release_path: releasePath,
          log,
          finished_at: new Date(),
        },
      });

      await this.pruneOldReleases(paths.releases);

      if (project.is_public) {
        await this.thumbnails.capture(project.id, project.slug);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      appendLog(`\nFAILED: ${message}`);
      await this.prisma.deployment.update({
        where: { id: deploymentId },
        data: { status: DeploymentStatus.FAILED, log, finished_at: new Date() },
      });

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

  private projectPaths(slug: string): ProjectPaths {
    const root = path.join(this.projectsRoot, slug);
    return {
      root,
      repo: path.join(root, 'repo'),
      releases: path.join(root, 'releases'),
      current: path.join(root, 'current'),
    };
  }

  private async cloneRepo(repositoryUrl: string, repoPath: string, log: (chunk: string) => void) {
    // Always a fresh shallow clone rather than fetch+reset on a reused checkout —
    // simpler and avoids default-branch/tracking-ref edge cases for an MVP.
    await fs.rm(repoPath, { recursive: true, force: true });
    log(`cloning ${repositoryUrl}\n`);
    await simpleGit().clone(repositoryUrl, repoPath, ['--depth', '1']);

    const sha = await simpleGit(repoPath).revparse(['HEAD']);
    return sha.trim();
  }

  private async runBuild(
    buildCommand: string,
    repoPath: string,
    outputDir: string,
    outputHostPath: string,
    log: (chunk: string) => void,
  ) {
    await this.dockerBuild.run(repoPath, buildCommand, outputDir, outputHostPath, log);
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
    try {
      const tempLink = `${paths.current}.tmp-${releaseId}`;
      await fs.symlink(releasePath, tempLink, 'dir');
      try {
        await fs.rename(tempLink, paths.current);
      } catch {
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

  private setStatus(deploymentId: string, status: DeploymentStatus) {
    return this.prisma.deployment.update({ where: { id: deploymentId }, data: { status } });
  }

  private async awardDeployXp(project: Project): Promise<void> {
    const priorSuccesses = await this.prisma.deployment.count({
      where: { project: { user_id: project.user_id }, status: DeploymentStatus.SUCCESS },
    });
    const xp = DEPLOY_XP + (priorSuccesses === 0 ? FIRST_DEPLOY_BONUS_XP : 0);
    await this.prisma.user.update({ where: { id: project.user_id }, data: { xp: { increment: xp } } });
  }
}
