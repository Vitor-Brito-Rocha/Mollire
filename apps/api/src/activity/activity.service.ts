import { Injectable } from '@nestjs/common';
import { ActivityType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  record(data: {
    project_id: string;
    type: ActivityType;
    actor_id?: string;
    payload?: Prisma.InputJsonValue;
  }): void {
    void this.prisma.projectActivity.create({ data }).catch(() => undefined);
  }

  async list(projectId: string, limit = 50) {
    const activities = await this.prisma.projectActivity.findMany({
      where: { project_id: projectId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    const actorIds = [...new Set(activities.map((a) => a.actor_id).filter((id): id is string => id !== null))];
    const users = actorIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, handle: true } })
      : [];
    const handleMap = new Map(users.map((u) => [u.id, u.handle ?? 'usuário']));

    return activities.map((a) => ({
      ...a,
      actor_handle: a.actor_id ? (handleMap.get(a.actor_id) ?? 'usuário') : null,
    }));
  }
}
