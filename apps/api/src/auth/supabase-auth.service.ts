import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role, User } from '@prisma/client';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from './types';

@Injectable()
export class SupabaseAuthService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const projectUrl = this.config.getOrThrow<string>('SUPABASE_PROJECT_URL');
    // Supabase signs access tokens with rotatable ES256 keys (not a shared HS256
    // secret) — createRemoteJWKSet fetches and caches the keyset, refetching on
    // an unknown `kid` so rotation is handled transparently.
    this.jwks = createRemoteJWKSet(new URL(`${projectUrl}/auth/v1/.well-known/jwks.json`));
    this.issuer = `${projectUrl}/auth/v1`;
  }

  async verifyAndSync(token: string): Promise<AuthenticatedUser> {
    const payload = await this.verify(token);

    const id = payload.sub;
    const email = typeof payload.email === 'string' ? payload.email : undefined;
    if (!id || !email) {
      throw new UnauthorizedException('token missing required claims');
    }

    return this.syncUser(id, email);
  }

  private async verify(token: string) {
    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: this.issuer,
        audience: 'authenticated',
      });
      return payload;
    } catch {
      throw new UnauthorizedException('invalid or expired token');
    }
  }

  // JIT-provisions our own User row from a verified token — nothing reads User
  // before a first authenticated call, so there's no need for a signup webhook.
  private async syncUser(id: string, email: string): Promise<AuthenticatedUser> {
    const normalizedEmail = email.toLowerCase();

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        // An admin can grant ADMIN to an email before that person ever logs in
        // (AdminService.inviteAdmin) — redeemed here, on that email's first sync.
        const invite = await tx.adminInvite.findUnique({ where: { email: normalizedEmail } });

        const existing = await tx.user.findUnique({ where: { id } });
        const synced = existing
          ? await tx.user.update({
              where: { id },
              data: {
                email,
                // Only ever promotes to ADMIN here, never demotes.
                ...(invite ? { role: Role.ADMIN } : {}),
                // Backfills users provisioned before handles existed.
                ...(existing.handle ? {} : { handle: await this.pickHandle(tx, email, id) }),
              },
            })
          : await tx.user.create({
              data: {
                id,
                email,
                role: invite ? Role.ADMIN : Role.TENANT,
                handle: await this.pickHandle(tx, email, id),
              },
            });

        if (invite) {
          await tx.adminInvite.delete({ where: { email: normalizedEmail } });
        }

        return synced;
      });
      return this.toAuthenticated(user);
    } catch (err) {
      // A brand-new user's first page load fires several authenticated
      // requests at once (header + page data), which can race here — by the
      // time Postgres reports the conflict, some row for this user already
      // exists, so read it back instead of failing the request over a
      // benign provisioning race.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const user = await this.prisma.user.findUniqueOrThrow({ where: { id } });
        return this.toAuthenticated(user);
      }
      throw err;
    }
  }

  private toAuthenticated(user: User): AuthenticatedUser {
    return { id: user.id, email: user.email, handle: user.handle, role: user.role, xp: user.xp };
  }

  // Default public handle: the email's local part cleaned to [a-z0-9._-],
  // 3–20 chars; a short slice of the user id disambiguates a collision. The
  // gallery shows this instead of the email, so every user gets one on their
  // first sync and can change it later via PATCH /users/me.
  private async pickHandle(tx: Prisma.TransactionClient, email: string, id: string): Promise<string> {
    const base =
      email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '')
        .slice(0, 20) || 'dev';
    const suffix = id.replace(/-/g, '').slice(0, 4);
    const candidates = [
      base.length >= 3 ? base : `${base}-${suffix}`,
      `${base.slice(0, 15)}-${suffix}`,
      `${base.slice(0, 11)}-${id.replace(/-/g, '').slice(0, 8)}`,
    ];
    for (const candidate of candidates) {
      const taken = await tx.user.findUnique({ where: { handle: candidate }, select: { id: true } });
      if (!taken || taken.id === id) return candidate;
    }
    return id.replace(/-/g, '').slice(0, 20);
  }
}
