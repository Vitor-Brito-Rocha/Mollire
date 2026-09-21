import { Injectable } from '@nestjs/common';
import { XpReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../xp/xp.service';
import { QUESTS } from './quests.catalog';

@Injectable()
export class QuestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
  ) {}

  // Evaluated on read rather than hooked into every place a quest can be done:
  // check what's still open, settle whatever now passes, return the whole list.
  async list(userId: string) {
    const completed = await this.prisma.questCompletion.findMany({ where: { user_id: userId } });
    const doneCodes = new Set(completed.map((c) => c.code));

    const open = QUESTS.filter((quest) => !doneCodes.has(quest.code));
    const passed = (
      await Promise.all(open.map(async (quest) => ((await quest.done(this.prisma, userId)) ? quest : null)))
    ).filter((quest) => quest !== null);

    for (const quest of passed) {
      await this.settle(userId, quest.code, quest.xp);
    }

    // Re-read: a concurrent request may have settled some of these first, and
    // completed_at should be the stored one either way.
    const rows = passed.length ? await this.prisma.questCompletion.findMany({ where: { user_id: userId } }) : completed;
    const at = new Map(rows.map((r) => [r.code, r.completed_at]));

    const quests = QUESTS.map((quest) => ({
      code: quest.code,
      xp: quest.xp,
      completed_at: at.get(quest.code) ?? null,
    }));
    return { quests, completed: quests.filter((q) => q.completed_at).length, total: quests.length };
  }

  // Marks the quest done and pays, atomically. skipDuplicates makes the insert a
  // no-op when a parallel request (two tabs, the 30 s poll) got there first, and
  // only the request whose insert actually landed pays.
  private async settle(userId: string, code: string, xp: number) {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.questCompletion.createMany({
        data: [{ user_id: userId, code }],
        skipDuplicates: true,
      });
      if (count === 1) {
        await this.xp.award(userId, XpReason.QUEST, { amount: xp }, tx);
      }
    });
  }
}
