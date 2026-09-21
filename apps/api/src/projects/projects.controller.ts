import { Body, Controller, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { CheckRootDirDto } from './dto/check-root-dir.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { SetVisibilityDto } from './dto/set-visibility.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.create(dto, user.id);
  }

  // Nothing is saved: lets the create/edit forms tell the user, as they type,
  // whether the folder they picked exists in the repository.
  @Post('check-root-dir')
  @HttpCode(200)
  async checkRootDir(@Body() dto: CheckRootDirDto, @CurrentUser() user: AuthenticatedUser) {
    return { status: await this.projectsService.checkRootDir(dto.repository_url, dto.root_dir, user.id) };
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findAllForUser(user.id);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.findBySlugForUser(slug, user.id);
  }

  @Get(':slug/activity')
  getActivity(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.projectsService.getActivity(slug, user.id);
  }

  @Patch(':slug')
  update(
    @Param('slug') slug: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.update(slug, user.id, dto);
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
