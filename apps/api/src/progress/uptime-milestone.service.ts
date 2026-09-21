import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UptimeService } from '../uptime/uptime.service';
import { AchievementsService } from './achievements.service';

const DAY_MS = 24 * 60 * 60 * 1000;

// Milliseconds from `now` until the next HH:MM on the server clock (its TZ).
// Exactly at HH:MM counts as already past, so it never fires twice in a minute.
export function msUntilNext(now: Date, hour: number, minute: number): number {
  const next = new Date(now);
  next.setHours(hour, minute, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

// uptime_30 is the one achievement no user action triggers: it becomes true just
// by time passing. Uptime is counted in whole days, so once a day is enough: this
// job wakes up at UPTIME_MILESTONE_AT (default 00:45, server timezone) and
// settles it (and pushes) for the few users who could have reached it. Every
// other achievement is checked at the event that causes it (see
// AchievementsService.checkAfterEvent).
//
// Lives here, not in UptimeService, because AchievementsService already depends
// on UptimeService — the other way round would be a circular dependency.
@Injectable()
export class UptimeMilestoneService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UptimeMilestoneService.name);
  private readonly hour: number;
  private readonly minute: number;
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly uptime: UptimeService,
    private readonly achievements: AchievementsService,
    config: ConfigService,
  ) {
    const at = String(config.get('UPTIME_MILESTONE_AT', '00:45'));
    const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(at);
    if (!match) {
      this.logger.warn(`UPTIME_MILESTONE_AT="${at}" is not HH:MM, using 00:45`);
    }
    this.hour = match ? Number(match[1]) : 0;
    this.minute = match ? Number(match[2]) : 45;
  }

  onModuleInit() {
    // Same switch as the pinger: without pings there is no streak to reward.
    if (!this.uptime.enabled) return;
    this.scheduleNext();
  }

  onModuleDestroy() {
    if (this.timer) clearTimeout(this.timer);
  }

  // A chained timeout rather than a 24 h interval, so the run stays at HH:MM
  // instead of drifting with restarts and daylight-saving changes.
  private scheduleNext() {
    this.timer = setTimeout(() => {
      void this.run().finally(() => this.scheduleNext());
    }, msUntilNext(new Date(), this.hour, this.minute));
    this.timer.unref();
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
