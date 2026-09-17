import { Module } from '@nestjs/common';
import { DeploymentsModule } from '../deployments/deployments.module';
import { ProjectsModule } from '../projects/projects.module';
import { AdminController } from './admin.controller';

@Module({
  imports: [ProjectsModule, DeploymentsModule],
  controllers: [AdminController],
})
export class AdminModule {}
