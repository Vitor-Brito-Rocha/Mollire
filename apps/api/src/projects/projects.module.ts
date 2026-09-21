import { Module } from '@nestjs/common';
import { ActivityModule } from '../activity/activity.module';
import { GithubModule } from '../github/github.module';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [ActivityModule, GithubModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
