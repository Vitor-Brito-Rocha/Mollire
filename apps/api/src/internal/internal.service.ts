import { Injectable } from '@nestjs/common';
import { Reader } from '@maxmind/geoip2-node';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types';

@Injectable()
export class InternalService {
  private geoReader: Reader | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async checkAccess(slug: string, user?: AuthenticatedUser): Promise<{ result: 'ok' | 'unauthorized' | 'forbidden' | 'not_found'; projectId?: string }> {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      select: { id: true, is_public: true },
    });

    if (!project) return { result: 'not_found' };
    if (project.is_public) return { result: 'ok', projectId: project.id };
    if (!user) return { result: 'unauthorized' };

    const membership = await this.prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: project.id, user_id: user.id } },
      select: { id: true },
    });

    return membership ? { result: 'ok', projectId: project.id } : { result: 'forbidden' };
  }

  trackView(projectId: string, visitorId: string, path: string, ip?: string): void {
    this.persistView(projectId, visitorId, path, ip).catch(() => {});
  }

  private async persistView(projectId: string, visitorId: string, path: string, ip?: string): Promise<void> {
    const country = ip ? await this.resolveCountry(ip) : null;
    const date = new Date(new Date().toISOString().split('T')[0]);

    await this.prisma.projectView.createMany({
      data: [{ project_id: projectId, visitor_id: visitorId, path, country, date }],
      skipDuplicates: true,
    });
  }

  private async resolveCountry(ip: string): Promise<string | null> {
    const dbPath = process.env.GEOIP_DB_PATH;
    if (!dbPath) return null;
    try {
      if (!this.geoReader) {
        this.geoReader = await Reader.open(dbPath);
      }
      return (this.geoReader as any).country(ip).country?.isoCode ?? null;
    } catch {
      return null;
    }
  }
}
