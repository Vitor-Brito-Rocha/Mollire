import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { ProjectsModule } from '../projects/projects.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [ProjectsModule, ActivityModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
