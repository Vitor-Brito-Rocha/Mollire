import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

// Paid to the project owner, not the person starring — rewards making
// something others appreciate, not the act of clicking.
const STAR_XP = 5;

@Injectable()
export class GalleryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: 'recentes' | 'destaque' | 'todos' | undefined, viewerId: string) {
    const projects = await this.prisma.project.findMany({
      where: { is_public: true },
      orderBy: filter === 'destaque' ? { stars: { _count: 'desc' } } : { created_at: 'desc' },
      include: {
        user: { select: { email: true } },
        _count: { select: { stars: true } },
        stars: { where: { user_id: viewerId }, select: { user_id: true } },
      },
    });

    return projects.map((project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      author: project.user.email,
      thumbnail_url: project.thumbnail_url,
      stars: project._count.stars,
      starred_by_viewer: project.stars.length > 0,
      created_at: project.created_at,
    }));
  }

  async star(slug: string, userId: string) {
    const project = await this.findPublicBySlug(slug);
    if (project.user_id === userId) {
      throw new ConflictException("can't star your own project");
    }

    try {
      await this.prisma.projectStar.create({
        data: { project_id: project.id, user_id: userId },
      });
      await this.prisma.user.update({
        where: { id: project.user_id },
        data: { xp: { increment: STAR_XP } },
      });
    } catch (err) {
      // Already starred — idempotent no-op, not an error.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) {
        throw err;
      }
    }

    return this.starState(project.id, userId);
  }

  async unstar(slug: string, userId: string) {
    const project = await this.findPublicBySlug(slug);
    // deleteMany, not delete: unstarring something never starred is a no-op,
    // not a 404 — the viewer's intent (not starred) is already satisfied.
    await this.prisma.projectStar.deleteMany({
      where: { project_id: project.id, user_id: userId },
    });
    return this.starState(project.id, userId);
  }

  private async findPublicBySlug(slug: string) {
    const project = await this.prisma.project.findFirst({ where: { slug, is_public: true } });
    if (!project) {
      throw new NotFoundException(`project "${slug}" not found`);
    }
    return project;
  }

  private async starState(projectId: string, userId: string) {
    const [stars, mine] = await Promise.all([
      this.prisma.projectStar.count({ where: { project_id: projectId } }),
      this.prisma.projectStar.findUnique({
        where: { project_id_user_id: { project_id: projectId, user_id: userId } },
      }),
    ]);
    return { stars, starred_by_viewer: !!mine };
  }
}
