import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GithubService } from './github.service';

// exists           — the folder is there
// missing          — the repository is reachable and has no such path
// not_a_directory  — the path exists but is a file
// unverified       — couldn't tell (private repo we have no access to, rate
//                    limit, provider down): never a reason to block; the deploy
//                    checks the real checkout anyway.
export type RootDirCheck = 'exists' | 'missing' | 'not_a_directory' | 'unverified';

const REQUEST_TIMEOUT_MS = 8_000;

// Looks into a repository *before* it is cloned, to tell the user right away
// that the folder they typed doesn't exist. Read-only, and only ever calls the
// two providers the repository_url validation already allows.
@Injectable()
export class RepoInspectorService {
  private readonly logger = new Logger(RepoInspectorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly github: GithubService,
  ) {}

  async checkRootDir(repositoryUrl: string, rootDir: string, userId: string): Promise<RootDirCheck> {
    if (!rootDir) return 'exists';

    try {
      const url = new URL(repositoryUrl);
      const repoPath = url.pathname.replace(/^\/+|\/+$/g, '').replace(/\.git$/, '');
      if (url.hostname === 'github.com') return await this.checkGithub(repoPath, rootDir, userId);
      if (url.hostname === 'gitlab.com') return await this.checkGitlab(repoPath, rootDir);
      return 'unverified';
    } catch (err) {
      this.logger.warn(`could not check "${rootDir}" in ${repositoryUrl}: ${err instanceof Error ? err.message : err}`);
      return 'unverified';
    }
  }

  private async checkGithub(fullName: string, rootDir: string, userId: string): Promise<RootDirCheck> {
    const headers = await this.githubAuthFor(fullName, userId);
    const resp = await this.get(`https://api.github.com/repos/${fullName}/contents/${rootDir}`, headers);

    if (resp.status === 404) return 'missing';
    if (!resp.ok) return 'unverified';
    // A directory listing is an array; a file (or symlink/submodule) is a single object.
    return Array.isArray(await resp.json()) ? 'exists' : 'not_a_directory';
  }

  // Picks the credentials that can actually see this repository: one of the
  // user's GitHub App installations (private repos), else none (public repos).
  // "Repository not found" and "path not found" are both 404, so the repository
  // is confirmed reachable first — otherwise a private repo would read as
  // "folder missing".
  private async githubAuthFor(fullName: string, userId: string): Promise<Record<string, string>> {
    const base = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    const accounts = await this.prisma.githubAccount.findMany({ where: { user_id: userId } });

    for (const account of accounts) {
      const token = await this.github.getInstallationToken(account.installation_id).catch(() => null);
      if (!token) continue;
      const headers = { ...base, Authorization: `Bearer ${token}` };
      if ((await this.get(`https://api.github.com/repos/${fullName}`, headers)).ok) return headers;
    }

    if ((await this.get(`https://api.github.com/repos/${fullName}`, base)).ok) return base;
    throw new Error('repository not reachable');
  }

  private async checkGitlab(projectPath: string, rootDir: string): Promise<RootDirCheck> {
    const project = `https://gitlab.com/api/v4/projects/${encodeURIComponent(projectPath)}`;
    if (!(await this.get(project)).ok) return 'unverified';

    const resp = await this.get(`${project}/repository/tree?path=${encodeURIComponent(rootDir)}&per_page=1`);
    if (resp.status === 404) return 'missing';
    if (!resp.ok) return 'unverified';
    // An empty listing means the path isn't a folder with content: absent, or a file.
    const entries = (await resp.json()) as unknown[];
    return entries.length > 0 ? 'exists' : 'missing';
  }

  private get(url: string, headers?: Record<string, string>): Promise<Response> {
    return fetch(url, { headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  }
}
