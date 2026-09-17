import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async setHandle(userId: string, handle: string) {
    try {
      return await this.prisma.user.update({
        where: { id: userId },
        data: { handle: handle.toLowerCase() },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`handle "${handle}" is already taken`);
      }
      throw err;
    }
  }
}
