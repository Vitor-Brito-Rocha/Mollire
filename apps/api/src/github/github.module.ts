import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GithubController } from './github.controller';
import { GithubService } from './github.service';

@Module({
  imports: [PrismaModule],
  controllers: [GithubController],
  providers: [GithubService],
  exports: [GithubService],
})
export class GithubModule {}
