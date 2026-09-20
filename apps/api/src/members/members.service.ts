import { ConflictException, Injectable } from '@nestjs/common';
import { InvitationStatus, ProjectRole } from '@prisma/client';
import { ActivityService } from '../activity/activity.service';
import { AuthenticatedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectsService } from '../projects/projects.service';

const INVITATION_DAYS = 14;

const expiresAt = () => new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60 * 1000);

@Injectable()
export class MembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projects: ProjectsService,
    private readonly activity: ActivityService,
  ) {}

  async list(slug: string, user: AuthenticatedUser) {
    const project = await this.projects.findForMember(slug, user.id);
    const members = await this.prisma.projectMember.findMany({
      where: { project_id: project.id },
      orderBy: [{ role: 'asc' }, { created_at: 'asc' }],
      include: { user: { select: { handle: true } } },
    });
    const isOwner = members.some((m) => m.user_id === user.id && m.role === ProjectRole.OWNER);

    // Pending invitations carry email addresses — only the owner sees them.
    const invitations = isOwner
      ? await this.prisma.projectInvitation.findMany({
          where: { project_id: project.id, status: InvitationStatus.PENDING },
          orderBy: { created_at: 'desc' },
        })
      : [];

    return {
      my_role: isOwner ? ProjectRole.OWNER : ProjectRole.MEMBER,
      members: members.map((m) => ({
        user_id: m.user_id,
        handle: m.user.handle ?? 'usuário',
        role: m.role,
        since: m.created_at,
      })),
      invitations: invitations.map((i) => ({
        id: i.id,
        email: i.email,
        role: i.role,
        created_at: i.created_at,
        expires_at: i.expires_at,
      })),
    };
  }

  // Someone who already has an account joins on the spot; someone who has
  // never logged in gets a pending invitation, redeemed on their first
  // GET /users/me. Either way the caller must own the project.
  async invite(slug: string, owner: AuthenticatedUser, email: string) {
    const project = await this.projects.findForMember(slug, owner.id, ProjectRole.OWNER);
    const normalized = email.trim().toLowerCase();
    if (normalized === owner.email.toLowerCase()) {
      throw new ConflictException("you're already the owner of this project");
    }

    const existing = await this.prisma.user.findUnique({ where: { email: normalized } });
    if (existing) {
      const member = await this.prisma.projectMember.upsert({
        where: { project_id_user_id: { project_id: project.id, user_id: existing.id } },
        create: { project_id: project.id, user_id: existing.id, role: ProjectRole.MEMBER },
        update: {},
      });
      this.activity.record({ project_id: project.id, type: 'MEMBER_ADDED', actor_id: owner.id, payload: { handle: existing.handle ?? 'usuário' } });
      return {
        status: 'added' as const,
        member: { user_id: member.user_id, handle: existing.handle ?? 'usuário', role: member.role, since: member.created_at },
      };
    }

    const invitation = await this.prisma.projectInvitation.upsert({
      where: { project_id_email: { project_id: project.id, email: normalized } },
      create: { project_id: project.id, email: normalized, invited_by: owner.id, expires_at: expiresAt() },
      // Re-inviting a revoked or expired address just refreshes it.
      update: { status: InvitationStatus.PENDING, invited_by: owner.id, expires_at: expiresAt(), accepted_at: null },
    });
    return {
      status: 'invited' as const,
      invitation: { id: invitation.id, email: invitation.email, role: invitation.role, created_at: invitation.created_at, expires_at: invitation.expires_at },
    };
  }

  async removeMember(slug: string, owner: AuthenticatedUser, userId: string) {
    const project = await this.projects.findForMember(slug, owner.id, ProjectRole.OWNER);
    if (userId === project.user_id) {
      throw new ConflictException("the owner can't be removed from their own project");
    }
    // deleteMany: removing someone who isn't a member is a no-op, not a 404.
    const removed = await this.prisma.projectMember.findFirst({
      where: { project_id: project.id, user_id: userId },
      include: { user: { select: { handle: true } } },
    });
    await this.prisma.projectMember.deleteMany({
      where: { project_id: project.id, user_id: userId, role: ProjectRole.MEMBER },
    });
    if (removed) {
      this.activity.record({ project_id: project.id, type: 'MEMBER_REMOVED', actor_id: owner.id, payload: { handle: removed.user.handle ?? 'usuário' } });
    }
  }

  async revokeInvitation(slug: string, owner: AuthenticatedUser, invitationId: string) {
    const project = await this.projects.findForMember(slug, owner.id, ProjectRole.OWNER);
    await this.prisma.projectInvitation.updateMany({
      where: { id: invitationId, project_id: project.id, status: InvitationStatus.PENDING },
      data: { status: InvitationStatus.REVOKED },
    });
  }

  // Turns every pending, unexpired invitation for this email into a
  // membership. Runs on GET /users/me rather than inside syncUser: that one
  // fires on every authenticated request, this is called a handful of times
  // per session.
  async redeemInvitations(user: AuthenticatedUser): Promise<number> {
    const pending = await this.prisma.projectInvitation.findMany({
      where: { email: user.email.toLowerCase(), status: InvitationStatus.PENDING, expires_at: { gt: new Date() } },
    });
    if (pending.length === 0) return 0;

    await this.prisma.$transaction(async (tx) => {
      for (const invitation of pending) {
        await tx.projectMember.upsert({
          where: { project_id_user_id: { project_id: invitation.project_id, user_id: user.id } },
          create: { project_id: invitation.project_id, user_id: user.id, role: invitation.role },
          update: {},
        });
        await tx.projectInvitation.update({
          where: { id: invitation.id },
          data: { status: InvitationStatus.ACCEPTED, accepted_at: new Date() },
        });
      }
    });
    return pending.length;
  }
}
