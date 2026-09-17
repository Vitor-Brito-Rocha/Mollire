import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

// One-time bonus for a project's first-ever publish to the gallery — see
// Project.published_at, which is what makes this un-farmable by re-toggling.
const PUBLISH_XP = 20;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto, userId: string) {
    const existing = await this.prisma.project.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`slug "${dto.slug}" is already taken`);
    }

    return this.prisma.project.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        repository_url: dto.repository_url,
        build_command: dto.build_command ?? undefined,
        output_dir: dto.output_dir ?? undefined,
        user_id: userId,
      },
    });
  }

  findAllForUser(userId: string) {
    return this.prisma.project.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findBySlugForUser(slug: string, userId: string) {
    // findFirst on {slug, user_id}, not findUnique-then-check: a mismatch must
    // come back as 404, same as a slug that doesn't exist at all — a tenant
    // should never be able to tell "not mine" apart from "doesn't exist".
    const project = await this.prisma.project.findFirst({
      where: { slug, user_id: userId },
      include: { deployments: { orderBy: { created_at: 'desc' }, take: 10 } },
    });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found`);
    }
    return project;
  }

  async setVisibility(slug: string, userId: string, isPublic: boolean) {
    // findFirst on {slug, user_id}, same ownership-scoping reasoning as
    // findBySlugForUser: a mismatch must 404, not reveal the project exists.
    const project = await this.prisma.project.findFirst({ where: { slug, user_id: userId } });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found`);
    }

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
        where: { id: userId },
        data: { xp: { increment: PUBLISH_XP } },
      });
    }

    return updated;
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
