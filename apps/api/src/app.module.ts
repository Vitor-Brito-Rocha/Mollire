import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'node:path';
import { ActivityModule } from './activity/activity.module';
import { AdminModule } from './admin/admin.module';
import { EnvVarsModule } from './env-vars/env-vars.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { InternalModule } from './internal/internal.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DeploymentsModule } from './deployments/deployments.module';
import { ErrorLogModule } from './error-log/error-log.module';
import { GalleryModule } from './gallery/gallery.module';
import { GithubModule } from './github/github.module';
import { MembersModule } from './members/members.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressModule } from './progress/progress.module';
import { ProjectsModule } from './projects/projects.module';
import { TurmasModule } from './turmas/turmas.module';
import { UptimeModule } from './uptime/uptime.module';
import { UsersModule } from './users/users.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { XpModule } from './xp/xp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Serves captured gallery thumbnails at /thumbnails/*.png. Nginx handles
    // the actual published projects; this is just the API's own static assets.
    ServeStaticModule.forRootAsync({
      useFactory: (config: ConfigService) => [
        {
          rootPath: path.resolve(config.get<string>('THUMBNAILS_DIR', './data/thumbnails')),
          serveRoot: '/thumbnails',
        },
      ],
      inject: [ConfigService],
    }),
    PrismaModule,
    ActivityModule,
    ErrorLogModule,
    NotificationsModule,
    AuthModule,
    ProjectsModule,
    DeploymentsModule,
    GalleryModule,
    GithubModule,
    MembersModule,
    TurmasModule,
    UsersModule,
    XpModule,
    UptimeModule,
    ProgressModule,
    AdminModule,
    EnvVarsModule,
    AnalyticsModule,
    InternalModule,
    WebhooksModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
