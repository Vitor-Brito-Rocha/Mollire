import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/types';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(slug: string, user: AuthenticatedUser) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      select: { id: true, user_id: true },
    });

    if (!project) throw new NotFoundException();

    const membership = await this.prisma.projectMember.findUnique({
      where: { project_id_user_id: { project_id: project.id, user_id: user.id } },
      select: { id: true },
    });

    if (!membership) throw new ForbiddenException();

    const thirtyDaysAgo = new Date(new Date().toISOString().split('T')[0]);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [total, byDay, byCountry, byPath] = await Promise.all([
      this.prisma.projectView.count({ where: { project_id: project.id } }),

      this.prisma.projectView.groupBy({
        by: ['date'],
        where: { project_id: project.id, date: { gte: thirtyDaysAgo } },
        _count: { visitor_id: true },
        orderBy: { date: 'asc' },
      }),

      this.prisma.projectView.groupBy({
        by: ['country'],
        where: { project_id: project.id, country: { not: null } },
        _count: { visitor_id: true },
        orderBy: { _count: { visitor_id: 'desc' } },
        take: 10,
      }),

      this.prisma.projectView.groupBy({
        by: ['path'],
        where: { project_id: project.id },
        _count: { visitor_id: true },
        orderBy: { _count: { visitor_id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      byDay: byDay.map((r) => ({ date: r.date, views: r._count.visitor_id })),
      byCountry: byCountry.map((r) => ({ country: r.country, views: r._count.visitor_id })),
      byPath: byPath.map((r) => ({ path: r.path, views: r._count.visitor_id })),
    };
  }
}
