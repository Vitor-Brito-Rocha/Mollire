import { Module } from '@nestjs/common';
import { EnvCryptoService } from '../common/env-crypto.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from '../projects/projects.module';
import { EnvVarsController } from './env-vars.controller';
import { EnvVarsService } from './env-vars.service';

@Module({
  imports: [PrismaModule, ProjectsModule],
  controllers: [EnvVarsController],
  providers: [EnvVarsService, EnvCryptoService],
  exports: [EnvVarsService],
})
export class EnvVarsModule {}
