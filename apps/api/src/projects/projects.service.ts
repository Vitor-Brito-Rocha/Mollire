import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProjectRole, XpReason } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { PrismaService } from '../prisma/prisma.service';
import { UptimeService } from '../uptime/uptime.service';
import { XpService } from '../xp/xp.service';
import { CreateProjectDto } from './dto/create-project.dto';

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
    private readonly xp: XpService,
    private readonly uptime: UptimeService,
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

    // The creator is the owner: Project.user_id says whose it is, the OWNER
    // membership row is what every tenant-facing lookup checks.
    return this.prisma.project.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        repository_url: dto.repository_url,
        build_command: dto.build_command ?? undefined,
        output_dir: dto.output_dir ?? undefined,
        user_id: userId,
        members: { create: { user_id: userId, role: ProjectRole.OWNER } },
      },
    });
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
      // One-time: Project.published_at is what makes this un-farmable by re-toggling.
      await this.xp.award(project.user_id, XpReason.PUBLISH, { projectId: project.id });
    }

    if (!isPublic) {
      await this.uptime.reset(project.id);
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
