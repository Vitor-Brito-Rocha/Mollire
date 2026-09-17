import { Body, Controller, Get, Patch } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { levelForXp } from '../common/level';
import { UpdateMeDto } from './dto/update-me.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // role isn't in the Supabase JWT (that JWT's own "role" claim is the Postgres
  // role, unrelated) — this is how the frontend learns whether to show the
  // admin section. UX only: RolesGuard is the actual enforcement.
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return { ...user, ...levelForXp(user.xp) };
  }

  // The handle is the only identity the gallery ever shows — never the email.
  // A default is derived on first login (SupabaseAuthService.pickHandle); this
  // lets the user choose their own.
  @Patch('me')
  async updateMe(@Body() dto: UpdateMeDto, @CurrentUser() user: AuthenticatedUser) {
    const updated = await this.usersService.setHandle(user.id, dto.handle);
    return { ...user, handle: updated.handle, ...levelForXp(user.xp) };
  }
}
