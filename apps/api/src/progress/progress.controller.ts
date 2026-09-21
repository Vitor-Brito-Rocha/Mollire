import { Controller, Get, Param } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { AuthenticatedUser } from '../auth/types';
import { AchievementsService } from './achievements.service';
import { QuestsService } from './quests.service';

// Shares the /users prefix with UsersController. Only `me/...` and
// `:handle/achievements` live here — neither collides with `GET /users/:handle`,
// which is a single segment. `me/achievements` must stay above
// `:handle/achievements`, or "me" would be looked up as a handle.
@Controller('users')
export class ProgressController {
  constructor(
    private readonly quests: QuestsService,
    private readonly achievements: AchievementsService,
  ) {}

  @Get('me/quests')
  myQuests(@CurrentUser() user: AuthenticatedUser) {
    return this.quests.list(user.id);
  }

  @Get('me/achievements')
  myAchievements(@CurrentUser() user: AuthenticatedUser) {
    return this.achievements.listMine(user.id);
  }

  @Public()
  @Get(':handle/achievements')
  achievementsOf(@Param('handle') handle: string) {
    return this.achievements.listPublic(handle);
  }
}
