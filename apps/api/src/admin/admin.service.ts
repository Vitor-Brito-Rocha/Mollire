import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // If the email already belongs to a synced user, promote it directly.
  // Otherwise it hasn't logged in yet — park it as a pending invite, redeemed
  // by SupabaseAuthService.syncUser the moment that email first authenticates.
  async inviteAdmin(email: string, invitedBy: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const select = { id: true, email: true, role: true, created_at: true, updated_at: true } as const;

    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail }, select });
    if (existing) {
      if (existing.role === Role.ADMIN) {
        return { status: 'already_admin' as const, user: existing };
      }
      const user = await this.prisma.user.update({
        where: { id: existing.id },
        data: { role: Role.ADMIN },
        select,
      });
      return { status: 'promoted' as const, user };
    }

    const invite = await this.prisma.adminInvite.upsert({
      where: { email: normalizedEmail },
      create: { email: normalizedEmail, invited_by: invitedBy },
      update: { invited_by: invitedBy },
    });
    return { status: 'invited' as const, invite };
  }

  async listAdmins() {
    const select = { id: true, email: true, role: true, created_at: true, updated_at: true } as const;
    const [admins, pendingInvites] = await Promise.all([
      this.prisma.user.findMany({ where: { role: Role.ADMIN }, orderBy: { email: 'asc' }, select }),
      this.prisma.adminInvite.findMany({ orderBy: { created_at: 'desc' } }),
    ]);
    return { admins, pendingInvites };
  }
}
