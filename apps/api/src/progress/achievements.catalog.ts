import { DeploymentStatus, ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UptimeService } from '../uptime/uptime.service';

export type Progress = { current: number; target: number };

type Deps = { prisma: PrismaService; uptime: UptimeService };

export type AchievementDef = {
  code: string;
  // `progress` only for the ones that count something; the API shows it while locked.
  check: (deps: Deps, userId: string) => Promise<{ unlocked: boolean; progress?: Progress }>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const counted = (current: number, target: number) => ({
  unlocked: current >= target,
  progress: { current: Math.min(current, target), target },
});

const succeededDeploys = (prisma: PrismaService, userId: string) =>
  prisma.deployment.count({ where: { status: DeploymentStatus.SUCCESS, project: { user_id: userId } } });

// Whole days the user's longest-standing published site has been up: the ping's
// unbroken run (UptimeService — which also restarts when it leaves the gallery),
// cut short by the last failed deploy.
async function longestUptimeDays({ prisma, uptime }: Deps, userId: string): Promise<number> {
  const projects = await prisma.project.findMany({
    where: { user_id: userId, is_public: true },
    select: { id: true },
  });

  const streaks = await Promise.all(
    projects.map(async (project) => {
      const [upSince, lastFailed] = await Promise.all([
        uptime.since(project.id),
        prisma.deployment.findFirst({
          where: { project_id: project.id, status: DeploymentStatus.FAILED },
          orderBy: { created_at: 'desc' },
          select: { created_at: true, finished_at: true },
        }),
      ]);
      if (!upSince) return 0;
      const failedAt = lastFailed ? (lastFailed.finished_at ?? lastFailed.created_at).getTime() : 0;
      return Math.floor((Date.now() - Math.max(upSince.getTime(), failedAt)) / DAY_MS);
    }),
  );
  return Math.max(0, ...streaks);
}

// Fixed order — it's the order the API returns. Adding one: an entry here and
// one in the frontend catalog (modules/progress/lib/catalog.ts).
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    code: 'first_deploy',
    check: async ({ prisma }, userId) => ({ unlocked: (await succeededDeploys(prisma, userId)) >= 1 }),
  },
  {
    code: 'ten_deploys',
    check: async ({ prisma }, userId) => counted(await succeededDeploys(prisma, userId), 10),
  },
  {
    code: 'first_star',
    check: async ({ prisma }, userId) => ({
      unlocked: (await prisma.projectStar.count({ where: { project: { user_id: userId } } })) >= 1,
    }),
  },
  {
    // Push to live in under a minute. created_at is when the deploy was queued,
    // so waiting for a build slot counts against it — that's the felt speed.
    code: 'fast_deploy',
    check: async ({ prisma }, userId) => {
      const [row] = await prisma.$queryRaw<{ ok: boolean }[]>`
        SELECT EXISTS (
          SELECT 1 FROM deployments d
          JOIN projects p ON p.id = d.project_id
          WHERE p.user_id = ${userId}
            AND d.status = 'SUCCESS'
            AND d.finished_at IS NOT NULL
            AND d.finished_at - d.created_at < interval '60 seconds'
        ) AS ok`;
      return { unlocked: row?.ok === true };
    },
  },
  {
    code: 'rollback',
    check: async ({ prisma }, userId) => ({
      unlocked:
        (await prisma.deployment.count({
          where: { is_rollback: true, status: DeploymentStatus.SUCCESS, project: { user_id: userId } },
        })) >= 1,
    }),
  },
  {
    code: 'collaborator',
    check: async ({ prisma }, userId) =>
      counted(await prisma.projectMember.count({ where: { user_id: userId, role: ProjectRole.MEMBER } }), 3),
  },
  {
    code: 'uptime_30',
    check: async (deps, userId) => counted(await longestUptimeDays(deps, userId), 30),
  },
];
