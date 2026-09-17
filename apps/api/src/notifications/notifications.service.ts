import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
// Namespace import (not a default import): web-push is CommonJS and this
// project's tsconfig doesn't set esModuleInterop, so a default import would
// compile but resolve to `undefined` at runtime.
import * as webpush from 'web-push';
import { PrismaService } from '../prisma/prisma.service';

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type StoredSubscription = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    webpush.setVapidDetails(
      this.config.getOrThrow<string>('VAPID_SUBJECT'),
      this.config.getOrThrow<string>('VAPID_PUBLIC_KEY'),
      this.config.getOrThrow<string>('VAPID_PRIVATE_KEY'),
    );
  }

  async notifyAdmins(payload: PushPayload): Promise<void> {
    const admins = await this.prisma.user.findMany({ where: { role: Role.ADMIN } });
    await Promise.all(admins.map((admin) => this.sendToUser(admin.id, payload)));
  }

  async notifyTenant(userId: string, payload: PushPayload): Promise<void> {
    await this.sendToUser(userId, payload);
  }

  // Never throws — called from failure paths (deploy pipeline, exception filter)
  // that must not themselves break if a push send fails.
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    try {
      const subscriptions = await this.prisma.pushSubscription.findMany({
        where: { user_id: userId },
      });
      await Promise.all(subscriptions.map((sub) => this.sendOne(sub, payload)));
    } catch (err) {
      this.logger.error(`failed to load push subscriptions for user ${userId}`, err as Error);
    }
  }

  private async sendOne(subscription: StoredSubscription, payload: PushPayload): Promise<void> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        JSON.stringify(payload),
      );
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      if (statusCode === 404 || statusCode === 410) {
        // Browser revoked this subscription — drop it instead of retrying forever.
        await this.prisma.pushSubscription
          .delete({ where: { id: subscription.id } })
          .catch(() => undefined);
      } else {
        this.logger.error(`push send failed for subscription ${subscription.id}`, err as Error);
      }
    }
  }
}
