import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [PrismaModule, MembersModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
