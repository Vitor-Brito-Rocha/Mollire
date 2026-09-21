import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorSource, Project } from '@prisma/client';
import * as fs from 'node:fs/promises';
import * as http from 'node:http';
import type { AddressInfo } from 'node:net';
import * as path from 'node:path';
import { chromium } from 'playwright';
import { ErrorLogService } from '../error-log/error-log.service';
import { PrismaService } from '../prisma/prisma.service';

const VIEWPORT = { width: 1280, height: 800 };
const LOAD_TIMEOUT_MS = 15000;
// Sites with polling/analytics/websockets never reach "networkidle", so it's only
// a best-effort settle after `load` — never a reason to skip the screenshot.
const SETTLE_TIMEOUT_MS = 3000;
const ANIMATION_GRACE_MS = 500;

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.wasm': 'application/wasm',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// Loopback / link-local / private ranges, by literal hostname. The tenant's JS runs
// in a browser on the API host, so it must not be able to poke at internal services
// (the API itself, cloud metadata…). This is a hostname check, not a DNS-level
// guarantee — a hardened setup would run the capture in a network-less container.
function isInternalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal')) return true;
  if (host === '::1' || host === '::' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80')) {
    return true;
  }
  const m = /^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);
  private readonly thumbnailsDir: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly errorLog: ErrorLogService,
  ) {
    this.thumbnailsDir = path.resolve(
      this.config.get<string>('THUMBNAILS_DIR', './data/thumbnails'),
    );
  }

  // Screenshots the release that was just published, served from disk on a
  // throwaway loopback port — the real build output, with no dependency on DNS,
  // TLS or Nginx being reachable from the API host. Never throws: called from the
  // deploy pipeline's success path, which must finish regardless of whether a
  // screenshot could be taken.
  async capture(project: Project, deploymentId: string, releasePath: string): Promise<void> {
    let browser;
    let server: http.Server | undefined;
    try {
      await fs.mkdir(this.thumbnailsDir, { recursive: true });
      // A new name per deploy busts browser/CDN caches of the previous image.
      const fileName = `${project.slug}-${deploymentId}.jpg`;

      server = await this.serveRelease(releasePath);
      const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

      browser = await chromium.launch();
      const context = await browser.newContext({ viewport: VIEWPORT });
      await context.route('**/*', (route) => {
        const url = new URL(route.request().url());
        const internal = isInternalHost(url.hostname) && url.origin !== origin;
        return internal ? route.abort('blockedbyclient') : route.continue();
      });

      const page = await context.newPage();
      await page.goto(origin, { waitUntil: 'load', timeout: LOAD_TIMEOUT_MS });
      await page.waitForLoadState('networkidle', { timeout: SETTLE_TIMEOUT_MS }).catch(() => undefined);
      await page.waitForTimeout(ANIMATION_GRACE_MS);
      await page.screenshot({
        path: path.join(this.thumbnailsDir, fileName),
        type: 'jpeg',
        quality: 80,
      });

      // Read fresh — the `project` we were handed predates this whole pipeline run.
      const { thumbnail_url: previous } = await this.prisma.project.findUniqueOrThrow({
        where: { id: project.id },
        select: { thumbnail_url: true },
      });
      await this.prisma.project.update({
        where: { id: project.id },
        data: { thumbnail_url: `/thumbnails/${fileName}` },
      });
      if (previous) {
        // basename() so a tampered DB value can't point the unlink outside the dir.
        await fs.rm(path.join(this.thumbnailsDir, path.basename(previous)), { force: true });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`thumbnail capture failed for "${project.slug}": ${message}`);
      // Recorded (not just logged) so a platform-level cause like a missing
      // Chromium is visible to admins instead of silently leaving the gallery empty.
      void this.errorLog.record({
        message: `thumbnail capture failed for "${project.slug}": ${message}`,
        stack: err instanceof Error ? err.stack : undefined,
        source: ErrorSource.DEPLOY_PIPELINE,
        user_id: project.user_id,
      });
    } finally {
      await browser?.close().catch(() => undefined);
      await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()));
    }
  }

  // Deletes the file a project's thumbnail_url points at. Best-effort: a project
  // being deleted must not be held up by a missing or locked image.
  async remove(thumbnailUrl: string | null): Promise<void> {
    if (!thumbnailUrl) return;
    // basename() so a tampered DB value can't point the unlink outside the dir.
    await fs
      .rm(path.join(this.thumbnailsDir, path.basename(thumbnailUrl)), { force: true })
      .catch((err) => this.logger.warn(`could not remove thumbnail "${thumbnailUrl}": ${err instanceof Error ? err.message : err}`));
  }

  // Static file server for one release dir, with the same SPA fallback the Nginx
  // block gives published sites (extension-less misses fall back to index.html).
  private async serveRelease(releasePath: string): Promise<http.Server> {
    const root = await fs.realpath(releasePath);

    const server = http.createServer((req, res) => {
      void this.respond(root, req, res).catch(() => {
        res.writeHead(500).end();
      });
    });
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    return server;
  }

  private async respond(root: string, req: http.IncomingMessage, res: http.ServerResponse) {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405).end();
      return;
    }

    let pathname: string;
    try {
      pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
    } catch {
      res.writeHead(400).end();
      return;
    }

    let file = await this.resolveInside(root, pathname);
    if (!file && !path.extname(pathname)) {
      file = await this.resolveInside(root, '/index.html');
    }
    if (!file) {
      res.writeHead(404).end();
      return;
    }

    const body = await fs.readFile(file);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
      'Content-Length': body.length,
    });
    res.end(req.method === 'HEAD' ? undefined : body);
  }

  // Returns the real path of a regular file that is inside `root`, else null.
  // realpath() first so a symlink in the tenant's build output can't escape it.
  private async resolveInside(root: string, pathname: string): Promise<string | null> {
    try {
      let candidate = await fs.realpath(path.join(root, pathname));
      if (candidate !== root && !candidate.startsWith(root + path.sep)) return null;
      if ((await fs.stat(candidate)).isDirectory()) {
        candidate = await fs.realpath(path.join(candidate, 'index.html'));
        if (!candidate.startsWith(root + path.sep)) return null;
      }
      return (await fs.stat(candidate)).isFile() ? candidate : null;
    } catch {
      return null;
    }
  }
}
