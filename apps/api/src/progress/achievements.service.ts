import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { XpReason } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { UptimeService } from '../uptime/uptime.service';
import { XP_VALUE } from '../xp/xp.rules';
import { XpService } from '../xp/xp.service';
import { ACHIEVEMENTS, Progress } from './achievements.catalog';
import { settleMilestone } from './settle-milestone';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
    private readonly uptime: UptimeService,
    private readonly notifications: NotificationsService,
    private readonly activity: ActivityService,
  ) {}

  // Same mechanic as quests: evaluated on read, settling whatever newly passes.
  // Returns every achievement, in catalog order; progress only while locked.
  // Silent on purpose: whoever is looking at the panel sees the result right there.
  async listMine(userId: string) {
    const { at, progressByCode } = await this.evaluate(userId);

    return ACHIEVEMENTS.map(({ code }) => {
      const unlockedAt = at.get(code) ?? null;
      const progress = unlockedAt ? undefined : progressByCode.get(code);
      return { code, unlocked_at: unlockedAt, ...(progress ? { progress } : {}) };
    });
  }

  // Called right after something that can unlock an achievement (deploy, star
  // received, joining a project): settles it and, for each one that is newly
  // unlocked, sends a push and — when the event happened in a project — records
  // it in that project's activity feed. Fire-and-forget and never throws: it runs
  // on the tail of paths that must not fail because a milestone check did.
  async checkAfterEvent(userId: string, projectId?: string): Promise<void> {
    try {
      const { newlyUnlocked } = await this.evaluate(userId);
      for (const achievement of newlyUnlocked) {
        if (projectId) {
          this.activity.record({
            project_id: projectId,
            type: 'ACHIEVEMENT_UNLOCKED',
            actor_id: userId,
            payload: { code: achievement.code, title: achievement.title },
          });
        }
        await this.notifications.notifyTenant(userId, {
          title: `Conquista desbloqueada: ${achievement.title}`,
          body: `+${XP_VALUE.ACHIEVEMENT} XP. Veja no seu perfil.`,
          url: '/perfil',
        });
      }
    } catch (err) {
      this.logger.warn(`achievement check failed for ${userId}: ${err instanceof Error ? err.message : err}`);
    }
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

  private async evaluate(userId: string) {
    const unlocked = await this.prisma.achievement.findMany({ where: { user_id: userId } });
    const unlockedCodes = new Set(unlocked.map((a) => a.code));

    const progressByCode = new Map<string, Progress>();
    const newlyUnlocked: { code: string; title: string }[] = [];
    await Promise.all(
      ACHIEVEMENTS.filter((a) => !unlockedCodes.has(a.code)).map(async (achievement) => {
        const result = await achievement.check({ prisma: this.prisma, uptime: this.uptime }, userId);
        if (result.unlocked) {
          // Only the request whose insert actually landed reports it as new, so a
          // race between two of them can't send the push twice.
          if (await this.settle(userId, achievement.code)) {
            newlyUnlocked.push({ code: achievement.code, title: achievement.title });
          }
        } else if (result.progress) {
          progressByCode.set(achievement.code, result.progress);
        }
      }),
    );

    // Re-read so unlocked_at is the stored value, also when a parallel request settled first.
    const rows =
      unlocked.length < ACHIEVEMENTS.length
        ? await this.prisma.achievement.findMany({ where: { user_id: userId } })
        : unlocked;
    const at = new Map(rows.map((r) => [r.code, r.unlocked_at]));
    return { at, progressByCode, newlyUnlocked };
  }

  private settle(userId: string, code: string): Promise<boolean> {
    return settleMilestone(this.prisma, this.xp, {
      table: (tx) => tx.achievement,
      userId,
      code,
      reason: XpReason.ACHIEVEMENT,
    });
  }
}
