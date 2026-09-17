import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.create(dto, user.id);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findAllForUser(user.id);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findBySlugForUser(slug, user.id);
  }
}
