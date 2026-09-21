import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { UptimeService } from '../uptime/uptime.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { SetVisibilityDto } from './dto/set-visibility.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly uptime: UptimeService,
  ) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.create(dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findAllForUser(user.id);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    const project = await this.projectsService.findBySlugForUser(slug, user.id);
    return { ...project, uptime_since: await this.uptime.since(project.id) };
  }

  @Get(':slug/activity')
  getActivity(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.getActivity(slug, user.id);
  }

  @Patch(':slug/visibility')
  setVisibility(
    @Param('slug') slug: string,
    @Body() dto: SetVisibilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.setVisibility(slug, user.id, dto.is_public);
  }
}
