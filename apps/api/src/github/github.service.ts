import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { SignJWT } from 'jose';

export type GithubRepo = {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  html_url: string;
  clone_url: string;
  default_branch: string;
};

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly appId: string;
  private readonly privateKeyPem: string;

  constructor(private readonly config: ConfigService) {
    this.appId = config.getOrThrow('GITHUB_APP_ID');
    this.privateKeyPem = config.getOrThrow('GITHUB_PRIVATE_KEY').replace(/\\n/g, '\n');
  }

  async getInstallationToken(installationId: bigint): Promise<string> {
    const jwt = await this.generateAppJwt();
    const resp = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: 'POST',
        headers: this.githubHeaders(`Bearer ${jwt}`),
      },
    );
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`GitHub API ${resp.status}: ${body}`);
    }
    const data = (await resp.json()) as { token: string };
    return data.token;
  }

  async listRepos(installationId: bigint): Promise<GithubRepo[]> {
    const token = await this.getInstallationToken(installationId);
    const resp = await fetch(
      'https://api.github.com/installation/repositories?per_page=100',
      { headers: this.githubHeaders(`Bearer ${token}`) },
    );
    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`GitHub API ${resp.status}: ${body}`);
    }
    const data = (await resp.json()) as { repositories: GithubRepo[] };

    const filtered = await Promise.all(
      data.repositories.map(async (repo) => {
        const isFrontend = await this.isFrontendRepo(repo.full_name, token);
        return isFrontend ? repo : null;
      }),
    );

    return filtered.filter((r): r is GithubRepo => r !== null);
  }

  private async isFrontendRepo(fullName: string, token: string): Promise<boolean> {
    const FRONTEND_CONFIG_FILES = new Set([
      'vite.config.ts', 'vite.config.js',
      'next.config.js', 'next.config.ts', 'next.config.mjs',
      'nuxt.config.ts', 'nuxt.config.js',
      'astro.config.mjs', 'astro.config.ts',
      'svelte.config.js', 'svelte.config.ts',
      'remix.config.js', 'remix.config.ts',
      'angular.json',
    ]);

    try {
      const resp = await fetch(
        `https://api.github.com/repos/${fullName}/contents/`,
        { headers: this.githubHeaders(`Bearer ${token}`) },
      );
      if (!resp.ok) return false;
      const entries = (await resp.json()) as Array<{ name: string; type: string }>;
      return entries.some((e) => e.type === 'file' && FRONTEND_CONFIG_FILES.has(e.name));
    } catch {
      return false;
    }
  }

  // Builds a clone URL with an embedded installation token so git can fetch
  // private repos without SSH keys. Only works for https:// URLs.
  async authenticatedCloneUrl(repositoryUrl: string, installationId: bigint): Promise<string> {
    if (!repositoryUrl.startsWith('https://')) return repositoryUrl;
    const token = await this.getInstallationToken(installationId);
    const url = new URL(repositoryUrl);
    url.username = 'x-access-token';
    url.password = token;
    return url.toString();
  }

  private async generateAppJwt(): Promise<string> {
    // GitHub generates PKCS#1 keys (-----BEGIN RSA PRIVATE KEY-----).
    // importPKCS8 only accepts PKCS#8 — use Node's createPrivateKey instead,
    // which handles both formats and jose accepts the resulting KeyObject.
    const privateKey = crypto.createPrivateKey(this.privateKeyPem);
    const now = Math.floor(Date.now() / 1000);
    // iat is pushed 60 s back for clock-skew tolerance; exp is kept within
    // GitHub's 10-minute (600 s) max measured from iat, not from now.
    return new SignJWT()
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(this.appId)
      .setIssuedAt(now - 60)
      .setExpirationTime(now + 539)
      .sign(privateKey);
  }

  private githubHeaders(authorization: string): Record<string, string> {
    return {
      Authorization: authorization,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }
}
