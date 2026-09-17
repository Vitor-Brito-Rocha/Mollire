import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { InviteMemberDto } from './dto/invite-member.dto';
import { MembersService } from './members.service';

// Members see the roster; only the owner changes it. Every route resolves the
// project through ProjectsService.findForMember, so a non-member gets 404.
@Controller('projects/:slug')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('members')
  list(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.membersService.list(slug, user);
  }

  @Post('invitations')
  invite(
    @Param('slug') slug: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.invite(slug, user, dto.email);
  }

  @Delete('members/:userId')
  @HttpCode(204)
  remove(
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.removeMember(slug, user, userId);
  }

  @Delete('invitations/:id')
  @HttpCode(204)
  revoke(
    @Param('slug') slug: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.revokeInvitation(slug, user, id);
  }
}
