import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module';
import { PrismaModule } from '../prisma/prisma.module';
import { XpModule } from '../xp/xp.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, MembersModule, XpModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
