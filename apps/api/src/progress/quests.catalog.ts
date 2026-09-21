import { DeploymentStatus, ProjectRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type QuestDef = {
  code: string;
  xp: number;
  // True once the user has done the thing, whatever their current state.
  done: (prisma: PrismaService, userId: string) => Promise<boolean>;
};

const any = async (count: Promise<number>) => (await count) > 0;

// Fixed order — it is the order the API returns and the panel shows. Adding a
// quest: one entry here, one in the frontend catalog (modules/progress/lib/catalog.ts).
export const QUESTS: QuestDef[] = [
  {
    code: 'connect_github',
    xp: 10,
    done: (prisma, userId) => any(prisma.githubAccount.count({ where: { user_id: userId } })),
  },
  {
    code: 'create_project',
    xp: 10,
    done: (prisma, userId) => any(prisma.project.count({ where: { user_id: userId } })),
  },
  {
    code: 'first_deploy',
    xp: 10,
    done: (prisma, userId) =>
      any(prisma.deployment.count({ where: { status: DeploymentStatus.SUCCESS, project: { user_id: userId } } })),
  },
  {
    code: 'publish_gallery',
    xp: 10,
    done: (prisma, userId) => any(prisma.project.count({ where: { user_id: userId, is_public: true } })),
  },
  {
    code: 'give_star',
    xp: 5,
    done: (prisma, userId) => any(prisma.projectStar.count({ where: { user_id: userId } })),
  },
  {
    // A pending invite, or someone who already joined (an accepted invite leaves
    // a member behind; adding an existing account skips the invite entirely).
    code: 'invite_member',
    xp: 10,
    done: async (prisma, userId) => {
      const [invited, joined] = await Promise.all([
        prisma.projectInvitation.count({ where: { invited_by: userId } }),
        prisma.projectMember.count({ where: { role: ProjectRole.MEMBER, project: { user_id: userId } } }),
      ]);
      return invited + joined > 0;
    },
  },
  {
    code: 'add_env_var',
    xp: 10,
    done: (prisma, userId) => any(prisma.projectEnvVar.count({ where: { project: { user_id: userId } } })),
  },
];
