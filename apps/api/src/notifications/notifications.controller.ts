import { Body, Controller, Delete, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/types';
import { PrismaService } from '../prisma/prisma.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { UnsubscribeDto } from './dto/unsubscribe.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('subscribe')
  async subscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubscribeDto) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        user_id: user.id,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
        user_agent: dto.user_agent,
      },
      update: {
        user_id: user.id,
        p256dh: dto.p256dh,
        auth: dto.auth,
        user_agent: dto.user_agent,
      },
    });
    return { status: 'ok' };
  }

  @Delete('subscribe')
  async unsubscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UnsubscribeDto) {
    // Scoped to the caller's own user_id so nobody can drop another user's
    // subscription just by knowing/guessing their endpoint URL.
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint: dto.endpoint, user_id: user.id },
    });
    return { status: 'ok' };
  }
}
