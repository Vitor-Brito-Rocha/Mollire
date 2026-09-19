import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { levelForXp } from '../common/level';
import { MembersService } from '../members/members.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly membersService: MembersService,
    private readonly prisma: PrismaService,
  ) {}

  // role isn't in the Supabase JWT (that JWT's own "role" claim is the Postgres
  // role, unrelated) — this is how the frontend learns whether to show the
  // admin section. UX only: RolesGuard is the actual enforcement.
  //
  // Also where pending project invitations for this email become memberships:
  // the frontend calls this right after login, and it's cheap enough to run
  // the check every time.
  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser) {
    const [joined, dbUser] = await Promise.all([
      this.membersService.redeemInvitations(user),
      this.prisma.user.findUnique({ where: { id: user.id }, select: { github_installation_id: true } }),
    ]);
    return {
      ...user,
      ...levelForXp(user.xp),
      joined_projects: joined,
      github_connected: dbUser?.github_installation_id != null,
    };
  }

  // The handle is the only identity the gallery ever shows — never the email.
  // A default is derived on first login (SupabaseAuthService.pickHandle); this
  // lets the user choose their own.
  @Patch('me')
  async updateMe(@Body() dto: UpdateMeDto, @CurrentUser() user: AuthenticatedUser) {
    const updated = await this.usersService.setHandle(user.id, dto.handle);
    return { ...user, handle: updated.handle, ...levelForXp(user.xp), joined_projects: 0 };
  }
}
