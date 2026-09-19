import { Module } from '@nestjs/common';
import { GalleryModule } from '../gallery/gallery.module';
import { ProjectsModule } from '../projects/projects.module';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';
import { DockerBuildService } from './docker-build.service';

@Module({
  imports: [ProjectsModule, GalleryModule],
  controllers: [DeploymentsController],
  providers: [DeploymentsService, DockerBuildService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
