import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Post,
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
  // The frontend reads the param and posts it here to persist it on the user.
  @Post('install')
  @HttpCode(204)
  async install(@Body() dto: InstallGithubDto, @CurrentUser() user: AuthenticatedUser) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { github_installation_id: BigInt(dto.installation_id) },
    });
  }

  @Delete('install')
  @HttpCode(204)
  async uninstall(@CurrentUser() user: AuthenticatedUser) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: { github_installation_id: null },
    });
  }

  @Get('repos')
  async repos(@CurrentUser() user: AuthenticatedUser) {
    const dbUser = await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    if (!dbUser.github_installation_id) {
      throw new NotFoundException('GitHub not connected — install the GitHub App first');
    }
    const repos = await this.github.listRepos(dbUser.github_installation_id);
    return repos.map(({ id, full_name, name, private: isPrivate, html_url, clone_url, default_branch }) => ({
      id,
      full_name,
      name,
      private: isPrivate,
      html_url,
      clone_url,
      default_branch,
    }));
  }
}
