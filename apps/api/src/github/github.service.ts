import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT, importPKCS8 } from 'jose';

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
    return data.repositories;
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
    const privateKey = await importPKCS8(this.privateKeyPem, 'RS256');
    const now = Math.floor(Date.now() / 1000);
    return new SignJWT()
      .setProtectedHeader({ alg: 'RS256' })
      .setIssuer(this.appId)
      .setIssuedAt(now - 60)
      .setExpirationTime(now + 600)
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
