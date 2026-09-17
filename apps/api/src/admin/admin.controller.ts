import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AuthenticatedUser } from '../auth/types';
import { DeploymentsService } from '../deployments/deployments.service';
import { ProjectsService } from '../projects/projects.service';
import { AdminService } from './admin.service';
import { InviteAdminDto } from './dto/invite-admin.dto';

// Project/deployment routes here are strictly read-only: view every tenant's
// projects/deployments/logs. The admins routes are the one deliberate
// exception — an admin managing who else is an admin.
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly deploymentsService: DeploymentsService,
    private readonly adminService: AdminService,
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

  @Get('admins')
  listAdmins() {
    return this.adminService.listAdmins();
  }

  // Promotes an existing user to ADMIN, or — if the email hasn't logged in
  // yet — parks a pending invite redeemed on that email's first login.
  @Post('admins')
  inviteAdmin(@Body() dto: InviteAdminDto, @CurrentUser() user: AuthenticatedUser) {
    return this.adminService.inviteAdmin(dto.email, user.id);
  }
}
