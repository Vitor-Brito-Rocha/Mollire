import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
// Long enough for "up N days" and the 30-day achievement, short enough to stay small.
const RETENTION_DAYS = 90;
const PARALLEL_CHECKS = 10;
// A latest check older than this many intervals means the pinger isn't running,
// so we don't know the site is up — better silent than a stale "up for 12 days".
const STALE_AFTER_INTERVALS = 6;

// Probes every published project's site on a timer and answers "up since when".
// In-process timer (single API instance, like the deploy queue) rather than a
// scheduler dependency. Off outside production unless UPTIME_CHECK_ENABLED=true,
// so a dev machine sharing the database doesn't ping real domains and write
// duplicate checks.
@Injectable()
export class UptimeService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UptimeService.name);
  private readonly domain: string;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private readonly enabled: boolean;
  private timer?: NodeJS.Timeout;
  private running = false;
  private lastPruneAt = 0;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.domain = config.getOrThrow<string>('DOMAIN');
    this.intervalMs = Number(config.get('UPTIME_CHECK_INTERVAL_MS', 10 * 60 * 1000));
    this.timeoutMs = Number(config.get('UPTIME_CHECK_TIMEOUT_MS', 10_000));
    this.enabled = String(config.get('UPTIME_CHECK_ENABLED', config.get('NODE_ENV') === 'production')) === 'true';
  }

  onModuleInit() {
    if (!this.enabled) return;
    // First round shortly after boot, not during it.
    setTimeout(() => void this.runChecks(), 30_000).unref();
    this.timer = setInterval(() => void this.runChecks(), this.intervalMs);
    this.timer.unref();
    this.logger.log(`site checks every ${Math.round(this.intervalMs / 1000)}s`);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // Start of the current unbroken run of ok checks; null when the latest check
  // failed, when there's none, or when the pinger has gone quiet.
  async since(projectId: string): Promise<Date | null> {
    const latest = await this.prisma.siteCheck.findFirst({
      where: { project_id: projectId },
      orderBy: { checked_at: 'desc' },
    });
    if (!latest?.ok) return null;
    if (Date.now() - latest.checked_at.getTime() > STALE_AFTER_INTERVALS * this.intervalMs) return null;

    const lastFailure = await this.prisma.siteCheck.findFirst({
      where: { project_id: projectId, ok: false },
      orderBy: { checked_at: 'desc' },
      select: { checked_at: true },
    });
    const runStart = await this.prisma.siteCheck.findFirst({
      where: { project_id: projectId, ok: true, ...(lastFailure ? { checked_at: { gt: lastFailure.checked_at } } : {}) },
      orderBy: { checked_at: 'asc' },
      select: { checked_at: true },
    });
    return runStart?.checked_at ?? null;
  }

  // Leaving the gallery ends the run: republishing starts counting from zero.
  async reset(projectId: string) {
    await this.prisma.siteCheck.deleteMany({ where: { project_id: projectId } });
  }

  async runChecks() {
    if (this.running) return;
    this.running = true;
    try {
      const projects = await this.prisma.project.findMany({
        where: { is_public: true },
        select: { id: true, slug: true },
      });
      for (let i = 0; i < projects.length; i += PARALLEL_CHECKS) {
        const batch = projects.slice(i, i + PARALLEL_CHECKS);
        const results = await Promise.all(batch.map(async (p) => ({ project_id: p.id, ok: await this.probe(p.slug) })));
        await this.prisma.siteCheck.createMany({ data: results });
      }
      await this.pruneOld();
    } catch (err) {
      this.logger.error(`site check round failed: ${err instanceof Error ? err.message : err}`);
    } finally {
      this.running = false;
    }
  }

  private async probe(slug: string): Promise<boolean> {
    try {
      const res = await fetch(`https://${slug}.${this.domain}`, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async pruneOld() {
    if (Date.now() - this.lastPruneAt < DAY_MS) return;
    this.lastPruneAt = Date.now();
    await this.prisma.siteCheck.deleteMany({ where: { checked_at: { lt: new Date(Date.now() - RETENTION_DAYS * DAY_MS) } } });
  }
}
