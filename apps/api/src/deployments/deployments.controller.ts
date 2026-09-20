import { Body, Controller, Get, MessageEvent, Param, Post, Sse } from '@nestjs/common';
import { Observable, from, switchMap, map } from 'rxjs';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
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
    return this.deploymentsService.trigger(project, { targetSha: dto.commit_sha });
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
