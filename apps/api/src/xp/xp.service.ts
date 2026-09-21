import { Injectable } from '@nestjs/common';
import { Prisma, XpReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { XP_VALUE } from './xp.rules';

export type AwardRef = {
  projectId?: string;
  // Who caused it: the person who starred, the owner who marked a comment.
  actorId?: string;
  // Only for reasons whose value varies per item (each quest has its own).
  amount?: number;
};

// The only way XP is paid: bumps User.xp and records the event together, so the
// history can't drift from the total. Pass `tx` to join a transaction the caller
// already has open (quests do, to pay exactly once).
@Injectable()
export class XpService {
  constructor(private readonly prisma: PrismaService) {}

  award(userId: string, reason: XpReason, ref: AwardRef = {}, tx?: Prisma.TransactionClient) {
    const amount = ref.amount ?? XP_VALUE[reason];
    const write = async (db: Prisma.TransactionClient) => {
      await db.user.update({ where: { id: userId }, data: { xp: { increment: amount } } });
      return db.xpEvent.create({
        data: { user_id: userId, amount, reason, project_id: ref.projectId, actor_id: ref.actorId },
      });
    };
    return tx ? write(tx) : this.prisma.$transaction(write);
  }

  async history(userId: string, limit: number) {
    const events = await this.prisma.xpEvent.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    const projectIds = [...new Set(events.map((e) => e.project_id).filter((id): id is string => !!id))];
    const actorIds = [...new Set(events.map((e) => e.actor_id).filter((id): id is string => !!id))];
    const [projects, actors] = await Promise.all([
      projectIds.length
        ? this.prisma.project.findMany({ where: { id: { in: projectIds } }, select: { id: true, slug: true, name: true } })
        : [],
      actorIds.length
        ? this.prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, handle: true } })
        : [],
    ]);
    const projectById = new Map(projects.map((p) => [p.id, p]));
    const handleById = new Map(actors.map((a) => [a.id, a.handle]));

    return events.map((event) => {
      const project = event.project_id ? projectById.get(event.project_id) : undefined;
      const handle = event.actor_id ? handleById.get(event.actor_id) : undefined;
      // A project that no longer exists leaves nothing to link to.
      const orphaned = !!event.project_id && !project;
      const ref = orphaned || (!project && !handle)
        ? null
        : {
            ...(project ? { project: { slug: project.slug, name: project.name } } : {}),
            // The public handle only — never the actor's e-mail.
            ...(handle ? { handle } : {}),
          };
      return { id: event.id, amount: event.amount, reason: event.reason, ref, created_at: event.created_at };
    });
  }
}
