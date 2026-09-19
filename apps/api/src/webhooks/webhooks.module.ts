import { Module } from '@nestjs/common';
import { DeploymentsModule } from '../deployments/deployments.module';
import { PrismaModule } from '../prisma/prisma.module';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [PrismaModule, DeploymentsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
