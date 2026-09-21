import { Prisma, XpReason } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { XpService } from '../xp/xp.service';

// The two tables that record "user reached X" — QuestCompletion and Achievement —
// have the same shape (user_id + code) and the same rule: pay the XP once.
type MilestoneTable = {
  createMany(args: { data: { user_id: string; code: string }[]; skipDuplicates: boolean }): Prisma.PrismaPromise<{ count: number }>;
};

// Marks the milestone reached and pays its XP, atomically. skipDuplicates turns
// the insert into a no-op when a parallel request (two tabs, a poll racing an
// event hook) got there first, and only the request whose insert actually landed
// pays — so the XP is paid exactly once. Returns whether THIS call did it, which
// is what callers use to decide whether to tell the user.
export function settleMilestone(
  prisma: PrismaService,
  xp: XpService,
  milestone: {
    table: (tx: Prisma.TransactionClient) => MilestoneTable;
    userId: string;
    code: string;
    reason: XpReason;
    amount?: number;
  },
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const { count } = await milestone.table(tx).createMany({
      data: [{ user_id: milestone.userId, code: milestone.code }],
      skipDuplicates: true,
    });
    if (count === 1) {
      await xp.award(milestone.userId, milestone.reason, { amount: milestone.amount }, tx);
    }
    return count === 1;
  });
}
