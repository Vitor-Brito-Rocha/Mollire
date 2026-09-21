import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { UptimeModule } from '../uptime/uptime.module';
import { XpModule } from '../xp/xp.module';
import { AchievementsService } from './achievements.service';
import { ProgressController } from './progress.controller';
import { QuestsService } from './quests.service';
import { UptimeMilestoneService } from './uptime-milestone.service';

@Module({
  imports: [XpModule, UptimeModule, ActivityModule],
  controllers: [ProgressController],
  providers: [QuestsService, AchievementsService, UptimeMilestoneService],
  exports: [AchievementsService],
})
export class ProgressModule {}
