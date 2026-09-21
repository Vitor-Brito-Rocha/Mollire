import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';
import { RepoInspectorService } from './repo-inspector.service';

@Module({
  imports: [PrismaModule],
  controllers: [GithubController],
  providers: [GithubService, RepoInspectorService],
  exports: [GithubService, RepoInspectorService],
})
export class GithubModule {}
