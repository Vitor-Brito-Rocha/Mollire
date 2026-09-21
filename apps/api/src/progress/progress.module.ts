import { Module } from '@nestjs/common';
import { UptimeModule } from '../uptime/uptime.module';
import { XpModule } from '../xp/xp.module';
import { AchievementsService } from './achievements.service';
import { ProgressController } from './progress.controller';
import { QuestsService } from './quests.service';

@Module({
  imports: [XpModule, UptimeModule],
  controllers: [ProgressController],
  providers: [QuestsService, AchievementsService],
  exports: [AchievementsService],
})
export class ProgressModule {}
