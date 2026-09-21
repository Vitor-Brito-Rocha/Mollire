import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeRootDir, ROOT_DIR_MESSAGE, ROOT_DIR_PATTERN } from '../projects/dto/create-project.dto';
import { detectBuildScript } from './build-script';
import { InstallGithubDto } from './dto/install-github.dto';
import { GithubService } from './github.service';

@Controller('github')
export class GithubController {
  constructor(
    private readonly github: GithubService,
    private readonly prisma: PrismaService,
  ) {}

  // Called by the frontend after GitHub redirects back with ?installation_id=…
  // Fetches installation metadata from GitHub and persists it as a GithubAccount.
  @Post('install')
  @HttpCode(204)
  async install(@Body() dto: InstallGithubDto, @CurrentUser() user: AuthenticatedUser) {
    const meta = await this.github.fetchInstallation(dto.installation_id);
    await this.prisma.githubAccount.upsert({
      where: { installation_id: BigInt(dto.installation_id) },
      create: { ...meta, installation_id: BigInt(dto.installation_id), user_id: user.id },
      update: { ...meta, user_id: user.id },
    });
  }

  @Delete('install/:installationId')
  @HttpCode(204)
  async uninstall(
    @Param('installationId', ParseIntPipe) installationId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const account = await this.prisma.githubAccount.findFirst({
      where: { installation_id: BigInt(installationId), user_id: user.id },
    });
    if (!account) throw new NotFoundException('GitHub account not found');
    await this.github.uninstall(account.installation_id);
    this.github.invalidateRepoCache(account.installation_id);
    await this.prisma.githubAccount.delete({ where: { id: account.id } });
  }

  @Get('accounts')
  async accounts(@CurrentUser() user: AuthenticatedUser) {
    const accounts = await this.prisma.githubAccount.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'asc' },
    });
    return accounts.map(({ installation_id, account_login, account_avatar_url, account_type, repository_selection, created_at }) => ({
      installation_id: installation_id.toString(),
      account_login,
      account_avatar_url,
      account_type,
      repository_selection,
      created_at,
    }));
  }

  // Reads the repo's package.json and either picks the build script or returns
  // the ranked candidates for the user to choose from.
  @Get('build-script')
  async buildScript(
    @CurrentUser() user: AuthenticatedUser,
    @Query('installation_id') installationId?: string,
    @Query('repo') repo?: string,
    @Query('root_dir') rawRootDir?: string,
  ) {
    if (!installationId || !/^\d+$/.test(installationId) || !repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
      throw new BadRequestException('installation_id and repo (owner/name) are required');
    }
    // Same folder rules as a project's root_dir, since it ends up in a GitHub API path.
    const rootDir = String(normalizeRootDir({ value: rawRootDir ?? '' }));
    if (!ROOT_DIR_PATTERN.test(rootDir)) {
      throw new BadRequestException(ROOT_DIR_MESSAGE);
    }
    const account = await this.prisma.githubAccount.findFirst({
      where: { installation_id: BigInt(installationId), user_id: user.id },
    });
    if (!account) throw new NotFoundException('GitHub account not found');
    const scripts = await this.github.fetchPackageScripts(account.installation_id, repo, rootDir);
    return detectBuildScript(scripts);
  }

  @Get('repos')
  async repos(@CurrentUser() user: AuthenticatedUser, @Query('available') available?: string) {
    const accounts = await this.prisma.githubAccount.findMany({
      where: { user_id: user.id },
    });
    if (accounts.length === 0) {
      throw new NotFoundException('GitHub not connected — install the GitHub App first');
    }
    const [perAccount, projects] = await Promise.all([
      Promise.all(
        accounts.map(async (a) =>
          (await this.github.listFrontendRepos(a.installation_id)).map((r) => ({
            ...r,
            installation_id: a.installation_id.toString(),
          })),
        ),
      ),
      this.prisma.project.findMany({
        where: { user_id: user.id },
        select: { repository_url: true },
      }),
    ]);
    const usedUrls = new Set(projects.map((p) => p.repository_url));
    const repos = perAccount.flat().map(({ id, installation_id, full_name, name, private: isPrivate, html_url, clone_url, default_branch }) => ({
      id,
      installation_id,
      full_name,
      name,
      private: isPrivate,
      html_url,
      clone_url,
      default_branch,
      has_project: usedUrls.has(clone_url) || usedUrls.has(clone_url.replace(/\.git$/, '')),
    }));
    return available === 'true' ? repos.filter((r) => !r.has_project) : repos;
  }
}
