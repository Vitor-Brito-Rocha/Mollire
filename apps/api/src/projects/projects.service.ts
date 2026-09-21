import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectRole } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { RepoInspectorService } from '../github/repo-inspector.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

// One-time bonus for a project's first-ever publish to the gallery — see
// Project.published_at, which is what makes this un-farmable by re-toggling.
const PUBLISH_XP = 20;

// Membership is the tenant boundary. Every lookup a tenant can trigger goes
// through findForMember / memberFilter, so the rule lives in one place: a
// project you're not a member of doesn't exist for you — 404, never 403,
// exactly like a slug that was never registered. A tenant must never be able
// to tell "not mine" apart from "doesn't exist".
@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
    private readonly repoInspector: RepoInspectorService,
  ) {}

  memberFilter(userId: string, minRole: ProjectRole = ProjectRole.MEMBER): Prisma.ProjectWhereInput {
    return {
      members: {
        some: { user_id: userId, ...(minRole === ProjectRole.OWNER ? { role: ProjectRole.OWNER } : {}) },
      },
    };
  }

  async findForMember(slug: string, userId: string, minRole: ProjectRole = ProjectRole.MEMBER) {
    const project = await this.prisma.project.findFirst({
      where: { slug, ...this.memberFilter(userId, minRole) },
    });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found`);
    }
    return project;
  }

  async create(dto: CreateProjectDto, userId: string) {
    const existing = await this.prisma.project.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`slug "${dto.slug}" is already taken`);
    }
    await this.assertRootDirExists(dto.repository_url, dto.root_dir ?? '', userId);

    // The creator is the owner: Project.user_id says whose it is, the OWNER
    // membership row is what every tenant-facing lookup checks.
    return this.prisma.project.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        repository_url: dto.repository_url,
        root_dir: dto.root_dir ?? undefined,
        build_command: dto.build_command ?? undefined,
        output_dir: dto.output_dir ?? undefined,
        user_id: userId,
        members: { create: { user_id: userId, role: ProjectRole.OWNER } },
      },
    });
  }

  // For the forms' live "does this folder exist?" feedback (nothing is saved).
  checkRootDir(repositoryUrl: string, rootDir: string, userId: string) {
    return this.repoInspector.checkRootDir(repositoryUrl, rootDir, userId);
  }

  // Refuses a folder that provably isn't in the repository. "unverified" (private
  // repo we can't read, provider down) passes: the deploy re-checks against the
  // actual checkout and fails with a clear message.
  private async assertRootDirExists(repositoryUrl: string, rootDir: string, userId: string) {
    const check = await this.repoInspector.checkRootDir(repositoryUrl, rootDir, userId);
    if (check === 'missing') {
      throw new BadRequestException(`root_dir "${rootDir}" was not found in the repository`);
    }
    if (check === 'not_a_directory') {
      throw new BadRequestException(`root_dir "${rootDir}" is a file, not a folder`);
    }
  }

  async findAllForUser(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: this.memberFilter(userId),
      orderBy: { created_at: 'desc' },
      include: { members: { where: { user_id: userId }, select: { role: true } } },
    });
    return projects.map(({ members, ...project }) => ({
      ...project,
      my_role: members[0]?.role ?? ProjectRole.MEMBER,
    }));
  }

  async findBySlugForUser(slug: string, userId: string) {
    const project = await this.prisma.project.findFirst({
      where: { slug, ...this.memberFilter(userId) },
      include: {
        deployments: { orderBy: { created_at: 'desc' }, take: 10 },
        members: { where: { user_id: userId }, select: { role: true } },
      },
    });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found`);
    }
    const { members, ...rest } = project;
    return { ...rest, my_role: members[0]?.role ?? ProjectRole.MEMBER };
  }

  // Owner only. Takes effect from the next deploy; a deploy already running
  // keeps the config it started with. The slug is not editable (see
  // UpdateProjectDto).
  async update(slug: string, userId: string, dto: UpdateProjectDto) {
    const project = await this.findForMember(slug, userId, ProjectRole.OWNER);

    // The folder must exist in the repository the project will really use, so
    // re-check when either half of that pair changes.
    if (dto.root_dir !== undefined || dto.repository_url !== undefined) {
      await this.assertRootDirExists(dto.repository_url ?? project.repository_url, dto.root_dir ?? project.root_dir, userId);
    }

    return this.prisma.project.update({
      where: { id: project.id },
      data: {
        name: dto.name?.trim(),
        repository_url: dto.repository_url,
        root_dir: dto.root_dir,
        build_command: dto.build_command,
        output_dir: dto.output_dir,
      },
    });
  }

  // Row only: members, invitations, deployments, stars, comments, env vars,
  // views and activity go with it through the schema's onDelete: Cascade.
  // DeploymentsService.removeProject is the entry point — it also refuses while
  // a deploy is running and clears the files on disk.
  async remove(projectId: string) {
    await this.prisma.project.delete({ where: { id: projectId } });
  }

  // Owner only: publishing changes what the world sees, and pays the owner's
  // one-time XP bonus.
  async setVisibility(slug: string, userId: string, isPublic: boolean) {
    const project = await this.findForMember(slug, userId, ProjectRole.OWNER);

    const firstPublish = isPublic && !project.published_at;

    const updated = await this.prisma.project.update({
      where: { id: project.id },
      data: {
        is_public: isPublic,
        ...(firstPublish ? { published_at: new Date() } : {}),
      },
    });

    if (firstPublish) {
      await this.prisma.user.update({
        where: { id: project.user_id },
        data: { xp: { increment: PUBLISH_XP } },
      });
    }

    this.activity.record({ project_id: project.id, type: 'VISIBILITY_CHANGED', actor_id: userId, payload: { is_public: isPublic } });
    return updated;
  }

  async getActivity(slug: string, userId: string) {
    const project = await this.findForMember(slug, userId);
    return this.activity.list(project.id);
  }

  // Unscoped by design — only AdminController may call these.
  findAll() {
    return this.prisma.project.findMany({
      orderBy: { created_at: 'desc' },
      include: { user: { select: { email: true } } },
    });
  }

  async findBySlug(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: {
        deployments: { orderBy: { created_at: 'desc' }, take: 10 },
        user: { select: { email: true } },
      },
    });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found`);
    }
    return project;
  }
}
