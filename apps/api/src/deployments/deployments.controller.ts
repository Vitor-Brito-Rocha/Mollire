import { BadRequestException, Body, Controller, Delete, Get, HttpCode, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { ProjectRole } from '@prisma/client';
import { Observable, from, switchMap, map } from 'rxjs';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { DeleteProjectDto } from '../projects/dto/delete-project.dto';
import { ProjectsService } from '../projects/projects.service';
import { DeploymentsService } from './deployments.service';
import { TriggerDeployDto } from './dto/trigger-deploy.dto';

@Controller()
export class DeploymentsController {
  constructor(
    private readonly deploymentsService: DeploymentsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post('projects/:slug/deploy')
  async trigger(
    @Param('slug') slug: string,
    @Body() dto: TriggerDeployDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    // findBySlugForUser, not findBySlug: without the ownership check here, any
    // authenticated tenant could deploy any other tenant's project by guessing
    // its slug — this is the concrete bug ownership-scoping exists to close.
    const project = await this.projectsService.findBySlugForUser(slug, user.id);
    return this.deploymentsService.trigger(project, { targetSha: dto.commit_sha, triggeredBy: user.id });
  }

  // Lives here rather than in ProjectsController because deleting has to look
  // at running deploys and clean up their files, which ProjectsModule can't
  // see (DeploymentsModule already depends on it, not the other way round).
  @Delete('projects/:slug')
  @HttpCode(204)
  async remove(
    @Param('slug') slug: string,
    @Body() dto: DeleteProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const project = await this.projectsService.findForMember(slug, user.id, ProjectRole.OWNER);
    if (dto.confirm_name.trim() !== project.name.trim()) {
      throw new BadRequestException('confirm_name does not match the project name');
    }
    await this.deploymentsService.removeProject(project);
  }

  @Get('deployments/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deploymentsService.findByIdForUser(id, user.id);
  }

  @Sse('projects/:slug/status')
  statusStream(
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Observable<MessageEvent> {
    return from(
      this.projectsService.findBySlugForUser(slug, user.id)
        .then((project) => this.deploymentsService.watchProject(project.id)),
    ).pipe(
      switchMap((obs$) => obs$),
      map((event) => ({ data: event })),
    );
  }
}
