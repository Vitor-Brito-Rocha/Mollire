import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { levelForXp } from '../common/level';
import { MembersService } from '../members/members.service';
import { PrismaService } from '../prisma/prisma.service';
import { XpHistoryDto } from '../xp/dto/xp-history.dto';
import { XpService } from '../xp/xp.service';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly membersService: MembersService,
    private readonly prisma: PrismaService,
    private readonly xp: XpService,
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
    const [joined, githubCount] = await Promise.all([
      this.membersService.redeemInvitations(user),
      this.prisma.githubAccount.count({ where: { user_id: user.id } }),
    ]);
    return {
      ...user,
      ...levelForXp(user.xp),
      joined_projects: joined,
      github_connected: githubCount > 0,
    };
  }

  @Get('me/xp/history')
  xpHistory(@Query() query: XpHistoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.xp.history(user.id, query.limit ?? 20);
  }

  @Public()
  @Get(':handle')
  async publicProfile(@Param('handle') handle: string) {
    return this.usersService.getPublicProfile(handle);
  }

  // The handle is the only identity the gallery ever shows — never the email.
  // A default is derived on first login (SupabaseAuthService.pickHandle); this
  // lets the user choose their own. Also where they pick their badge frame among
  // the ones their level unlocks.
  //
  // The response is written straight into the frontend's session cache, so it
  // has to be the full /users/me shape — github_connected included.
  @Patch('me')
  async updateMe(@Body() dto: UpdateMeDto, @CurrentUser() user: AuthenticatedUser) {
    const [updated, githubCount] = await Promise.all([
      this.usersService.updateMe(user, dto),
      this.prisma.githubAccount.count({ where: { user_id: user.id } }),
    ]);
    return {
      ...user,
      handle: updated.handle,
      frame: updated.frame,
      ...levelForXp(user.xp),
      joined_projects: 0,
      github_connected: githubCount > 0,
    };
  }
}
