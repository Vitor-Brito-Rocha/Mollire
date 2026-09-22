import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { AuthenticatedUser } from '../auth/types';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateTurmaDto } from './dto/create-turma.dto';
import { GradeProjectDto } from './dto/grade-project.dto';
import { JoinTurmaDto } from './dto/join-turma.dto';
import { SubmitProjectDto } from './dto/submit-project.dto';
import { TurmasService } from './turmas.service';

@Controller('turmas')
export class TurmasController {
  constructor(private readonly turmasService: TurmasService) {}

  @Post()
  create(@Body() dto: CreateTurmaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.create(dto, user);
  }

  @Post('join')
  joinByCode(@Body() dto: JoinTurmaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.joinByCode(dto.code, user);
  }

  @Get('mine')
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.listMine(user);
  }

  // Public browse: anyone signed in can see which public turmas exist, to
  // join without needing a code.
  @Get('public')
  listPublic(@CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.listPublic(user.id);
  }

  @Post(':id/join')
  joinPublic(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.joinPublic(id, user);
  }

  @Get(':id')
  detail(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.detail(id, user);
  }

  @Get(':id/students')
  students(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.students(id, user);
  }

  @Post(':id/groups')
  addGroup(@Param('id') id: string, @Body() dto: CreateGroupDto, @CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.addGroup(id, user, dto);
  }

  @Delete(':id/groups/:groupId')
  @HttpCode(204)
  removeGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turmasService.removeGroup(id, user, groupId);
  }

  @Post(':id/groups/:groupId/join')
  joinGroup(
    @Param('id') id: string,
    @Param('groupId') groupId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turmasService.joinGroup(id, groupId, user);
  }

  @Delete(':id/group')
  @HttpCode(204)
  leaveGroup(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.turmasService.leaveGroup(id, user);
  }

  // Public if the turma is public; members-only otherwise. Same "doesn't
  // exist to you" rule as the rest of the app — see TurmasService.
  @Public()
  @Get(':id/gallery')
  gallery(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser | undefined) {
    return this.turmasService.gallery(id, user);
  }

  @Post(':id/projects')
  submitProject(
    @Param('id') id: string,
    @Body() dto: SubmitProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turmasService.submitProject(id, user, dto.project_slug);
  }

  @Delete(':id/projects/:slug')
  @HttpCode(204)
  removeSubmission(
    @Param('id') id: string,
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turmasService.removeSubmission(id, user, slug);
  }

  @Post(':id/projects/:slug/grade')
  gradeProject(
    @Param('id') id: string,
    @Param('slug') slug: string,
    @Body() dto: GradeProjectDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turmasService.gradeProject(id, user, slug, dto.grade);
  }

  @Post(':id/projects/:slug/star')
  star(
    @Param('id') id: string,
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turmasService.star(id, slug, user.id);
  }

  @Delete(':id/projects/:slug/star')
  unstar(
    @Param('id') id: string,
    @Param('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.turmasService.unstar(id, slug, user.id);
  }
}
