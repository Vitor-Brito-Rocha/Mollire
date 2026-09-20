import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { levelForXp } from '../common/level';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(handle: string) {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      select: { id: true, handle: true, xp: true, created_at: true },
    });
    if (!user) throw new NotFoundException(`user "${handle}" not found`);

    const [projects, activities] = await Promise.all([
      this.prisma.project.findMany({
        where: { is_public: true, members: { some: { user_id: user.id, role: 'OWNER' } } },
        select: {
          slug: true,
          name: true,
          thumbnail_url: true,
          published_at: true,
          _count: { select: { stars: true } },
        },
        orderBy: { published_at: 'desc' },
      }),
      this.prisma.projectActivity.findMany({
        where: {
          actor_id: user.id,
          type: { in: [ActivityType.DEPLOY_TRIGGERED, ActivityType.COMMENT_ADDED] },
          created_at: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
        select: { created_at: true },
      }),
    ]);

    const heatmapMap = new Map<string, number>();
    for (const a of activities) {
      const day = a.created_at.toISOString().slice(0, 10);
      heatmapMap.set(day, (heatmapMap.get(day) ?? 0) + 1);
    }

    return {
      handle: user.handle!,
      xp: user.xp,
      ...levelForXp(user.xp),
      joined_at: user.created_at,
      projects: projects.map((p) => ({
        slug: p.slug,
        name: p.name,
        thumbnail_url: p.thumbnail_url,
        stars: p._count.stars,
        published_at: p.published_at,
      })),
      heatmap: Array.from(heatmapMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async setHandle(userId: string, handle: string) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { handle: handle.toLowerCase() },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`handle "${handle}" is already taken`);
      }
      throw err;
    }
  }
}
