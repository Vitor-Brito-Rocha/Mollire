import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DeploymentsService } from '../deployments/deployments.service';
import { ProjectsService } from '../projects/projects.service';

// Strictly read-only: view every tenant's projects/deployments/logs. No route
// here mutates another tenant's data — that's a deliberately bigger security
// surface than what was asked for, so it isn't built until it's actually needed.
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly deploymentsService: DeploymentsService,
  ) {}

  @Get('projects')
  findAllProjects() {
    return this.projectsService.findAll();
  }

  @Get('projects/:slug')
  findProject(@Param('slug') slug: string) {
    return this.projectsService.findBySlug(slug);
  }

  @Get('deployments/:id')
  findDeployment(@Param('id') id: string) {
    return this.deploymentsService.findById(id);
  }
}
