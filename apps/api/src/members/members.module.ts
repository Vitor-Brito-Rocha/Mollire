import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ProgressModule } from '../progress/progress.module';
import { ProjectsModule } from '../projects/projects.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [ProjectsModule, ActivityModule, ProgressModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
