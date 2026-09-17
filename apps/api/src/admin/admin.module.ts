import { Module } from '@nestjs/common';
import { DeploymentsModule } from '../deployments/deployments.module';
import { ProjectsModule } from '../projects/projects.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ProjectsModule, DeploymentsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
