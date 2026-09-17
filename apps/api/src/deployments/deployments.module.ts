import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { DeploymentsController } from './deployments.controller';
import { DeploymentsService } from './deployments.service';

@Module({
  imports: [ProjectsModule],
  controllers: [DeploymentsController],
  providers: [DeploymentsService],
  exports: [DeploymentsService],
})
export class DeploymentsModule {}
