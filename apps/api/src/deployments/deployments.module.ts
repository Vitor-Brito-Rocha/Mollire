import { Module } from '@nestjs/common';
import { EnvVarsModule } from '../env-vars/env-vars.module';
import { GalleryModule } from '../gallery/gallery.module';
import { GithubModule } from '../github/github.module';
import { ProjectsModule } from '../projects/projects.module';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { DockerBuildService } from './docker-build.service';

@Module({
  imports: [ProjectsModule, GalleryModule, GithubModule, EnvVarsModule],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, DockerBuildService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
