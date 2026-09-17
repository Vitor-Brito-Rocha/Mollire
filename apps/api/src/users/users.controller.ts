import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';

@Controller('users')
export class UsersController {
  // role isn't in the Supabase JWT (that JWT's own "role" claim is the Postgres
  // role, unrelated) — this is how the frontend learns whether to show the
  // admin section. UX only: RolesGuard is the actual enforcement.
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }
}
