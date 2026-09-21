import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/types';
import { FRAME_MIN_LEVEL, FrameId } from '../common/frames';
import { levelForXp } from '../common/level';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getPublicProfile(handle: string) {
    const user = await this.prisma.user.findUnique({
      where: { handle },
      select: { id: true, handle: true, frame: true, xp: true, created_at: true },
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
      frame: user.frame,
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

  async updateMe(user: AuthenticatedUser, dto: UpdateMeDto) {
    if (dto.handle === undefined && dto.frame === undefined) {
      throw new BadRequestException('nothing to update: send handle and/or frame');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.handle !== undefined) {
      data.handle = dto.handle.toLowerCase();
    }
    if (dto.frame !== undefined) {
      const frame = dto.frame as FrameId;
      const { level } = levelForXp(user.xp);
      if (level < FRAME_MIN_LEVEL[frame]) {
        throw new BadRequestException(`frame "${frame}" unlocks at level ${FRAME_MIN_LEVEL[frame]}`);
      }
      // The default frame is stored as "nothing chosen".
      data.frame = frame === 'default' ? null : frame;
    }

    try {
      return await this.prisma.user.update({ where: { id: user.id }, data });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`handle "${dto.handle}" is already taken`);
      }
      throw err;
    }
  }
}
