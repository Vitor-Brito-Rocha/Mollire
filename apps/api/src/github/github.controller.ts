import {
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

  @Get('repos')
  async repos(@CurrentUser() user: AuthenticatedUser, @Query('available') available?: string) {
    const accounts = await this.prisma.githubAccount.findMany({
      where: { user_id: user.id },
    });
    if (accounts.length === 0) {
      throw new NotFoundException('GitHub not connected — install the GitHub App first');
    }
    const [perAccount, projects] = await Promise.all([
      Promise.all(accounts.map((a) => this.github.listFrontendRepos(a.installation_id))),
      this.prisma.project.findMany({
        where: { user_id: user.id },
        select: { repository_url: true },
      }),
    ]);
    const usedUrls = new Set(projects.map((p) => p.repository_url));
    const repos = perAccount.flat().map(({ id, full_name, name, private: isPrivate, html_url, clone_url, default_branch }) => ({
      id,
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
