import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { GithubModule } from '../github/github.module';
import { UptimeModule } from '../uptime/uptime.module';
import { XpModule } from '../xp/xp.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [ActivityModule, GithubModule, XpModule, UptimeModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
