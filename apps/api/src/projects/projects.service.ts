import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

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
