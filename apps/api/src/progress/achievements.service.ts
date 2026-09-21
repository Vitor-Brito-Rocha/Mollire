import { Injectable, NotFoundException } from '@nestjs/common';
import { XpReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UptimeService } from '../uptime/uptime.service';
import { XpService } from '../xp/xp.service';
import { ACHIEVEMENTS, Progress } from './achievements.catalog';

@Injectable()
export class AchievementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
    private readonly uptime: UptimeService,
  ) {}

  // Same mechanic as quests: evaluated on read, settling whatever newly passes.
  // Returns every achievement, in catalog order; progress only while locked.
  async listMine(userId: string) {
    const unlocked = await this.prisma.achievement.findMany({ where: { user_id: userId } });
    const unlockedCodes = new Set(unlocked.map((a) => a.code));

    const progressByCode = new Map<string, Progress>();
    let settled = 0;
    await Promise.all(
      ACHIEVEMENTS.filter((a) => !unlockedCodes.has(a.code)).map(async (achievement) => {
        const result = await achievement.check({ prisma: this.prisma, uptime: this.uptime }, userId);
        if (result.unlocked) {
          await this.settle(userId, achievement.code);
          settled++;
        } else if (result.progress) {
          progressByCode.set(achievement.code, result.progress);
        }
      }),
    );

    // Re-read so unlocked_at is the stored value, also when a parallel request settled first.
    const rows = settled ? await this.prisma.achievement.findMany({ where: { user_id: userId } }) : unlocked;
    const at = new Map(rows.map((r) => [r.code, r.unlocked_at]));

    return ACHIEVEMENTS.map(({ code }) => {
      const unlockedAt = at.get(code) ?? null;
      const progress = unlockedAt ? undefined : progressByCode.get(code);
      return { code, unlocked_at: unlockedAt, ...(progress ? { progress } : {}) };
    });
  }

  // Public profile: only what's been earned, no progress. Read-only — a stranger's
  // page view never evaluates or pays anything.
  async listPublic(handle: string) {
    const user = await this.prisma.user.findUnique({ where: { handle: handle.toLowerCase() }, select: { id: true } });
    if (!user) throw new NotFoundException(`user "${handle}" not found`);

    const rows = await this.prisma.achievement.findMany({
      where: { user_id: user.id },
      orderBy: { unlocked_at: 'asc' },
    });
    const known = new Set(ACHIEVEMENTS.map((a) => a.code));
    return rows.filter((r) => known.has(r.code)).map((r) => ({ code: r.code, unlocked_at: r.unlocked_at }));
  }

  private async settle(userId: string, code: string) {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.achievement.createMany({ data: [{ user_id: userId, code }], skipDuplicates: true });
      if (count === 1) {
        await this.xp.award(userId, XpReason.ACHIEVEMENT, {}, tx);
      }
    });
  }
}
