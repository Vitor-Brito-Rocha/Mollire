import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UptimeService } from '../uptime/uptime.service';
import { AchievementsService } from './achievements.service';

const DAY_MS = 24 * 60 * 60 * 1000;

// uptime_30 is the one achievement no user action triggers: it becomes true just
// by time passing. So this job wakes up periodically and settles it (and pushes)
// for the few users who could have reached it. Every other achievement is
// checked at the event that causes it (see AchievementsService.checkAfterEvent).
//
// Lives here, not in UptimeService, because AchievementsService already depends
// on UptimeService — the other way round would be a circular dependency.
@Injectable()
export class UptimeMilestoneService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UptimeMilestoneService.name);
  private readonly intervalMs: number;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly uptime: UptimeService,
    private readonly achievements: AchievementsService,
    config: ConfigService,
  ) {
    this.intervalMs = Number(config.get('UPTIME_MILESTONE_INTERVAL_MS', 60 * 60 * 1000));
  }

  onModuleInit() {
    // Same switch as the pinger: without pings there is no streak to reward.
    if (!this.uptime.enabled) return;
    this.timer = setInterval(() => void this.run(), this.intervalMs);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async run() {
    if (this.running) return;
    this.running = true;
    try {
      // Only someone whose published site already has a check 30+ days old can
      // have a 30-day streak, and only if they haven't unlocked it yet.
      const candidates = await this.prisma.user.findMany({
        where: {
          achievements: { none: { code: 'uptime_30' } },
          projects: {
            some: {
              is_public: true,
              site_checks: { some: { checked_at: { lte: new Date(Date.now() - 30 * DAY_MS) } } },
            },
          },
        },
        select: { id: true },
      });
      for (const { id } of candidates) {
        await this.achievements.checkAfterEvent(id);
      }
    } catch (err) {
      this.logger.error(`uptime milestone round failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      this.running = false;
    }
  }
}
