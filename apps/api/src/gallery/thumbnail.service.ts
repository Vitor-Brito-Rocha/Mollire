import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { chromium } from 'playwright';
import { PrismaService } from '../prisma/prisma.service';

const VIEWPORT = { width: 1280, height: 800 };

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);
  private readonly thumbnailsDir: string;
  private readonly domain: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.thumbnailsDir = path.resolve(
      this.config.get<string>('THUMBNAILS_DIR', './data/thumbnails'),
    );
    this.domain = this.config.getOrThrow<string>('DOMAIN');
  }

  // Screenshots the project's own published subdomain — real output, not a
  // mock. Never throws: called from the deploy pipeline's success path,
  // which must finish regardless of whether a screenshot could be taken.
  async capture(projectId: string, slug: string): Promise<void> {
    let browser;
    try {
      await fs.mkdir(this.thumbnailsDir, { recursive: true });
      const fileName = `${slug}.png`;

      browser = await chromium.launch();
      const page = await browser.newPage({ viewport: VIEWPORT });
      await page.goto(`https://${slug}.${this.domain}`, {
        waitUntil: 'networkidle',
        timeout: 15000,
      });
      await page.screenshot({ path: path.join(this.thumbnailsDir, fileName) });

      await this.prisma.project.update({
        where: { id: projectId },
        data: { thumbnail_url: `/thumbnails/${fileName}` },
      });
    } catch (err) {
      this.logger.warn(`thumbnail capture failed for "${slug}": ${(err as Error).message}`);
    } finally {
      await browser?.close().catch(() => undefined);
    }
  }
}
