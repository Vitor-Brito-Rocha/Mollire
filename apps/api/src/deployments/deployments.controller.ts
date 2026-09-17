import { Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { ProjectsService } from '../projects/projects.service';
import { DeploymentsService } from './deployments.service';

@Controller()
export class DeploymentsController {
  constructor(
    private readonly deploymentsService: DeploymentsService,
    private readonly projectsService: ProjectsService,
  ) {}

  @Post('projects/:slug/deploy')
  async trigger(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    // findBySlugForUser, not findBySlug: without the ownership check here, any
    // authenticated tenant could deploy any other tenant's project by guessing
    // its slug — this is the concrete bug ownership-scoping exists to close.
    const project = await this.projectsService.findBySlugForUser(slug, user.id);
    return this.deploymentsService.trigger(project);
  }

  @Get('deployments/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.deploymentsService.findByIdForUser(id, user.id);
  }
}
