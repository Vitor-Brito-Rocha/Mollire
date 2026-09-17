import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [ProjectsModule],
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
