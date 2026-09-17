import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ErrorSource } from '@prisma/client';
import { AppModule } from './app.module';
import { ErrorLogService } from './error-log/error-log.service';
import { NotificationsService } from './notifications/notifications.service';

function withTimeout(promise: Promise<unknown>, ms: number): Promise<unknown> {
  return Promise.race([promise, new Promise((resolve) => setTimeout(resolve, ms))]);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const frontendUrls = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  app.enableCors({ origin: frontendUrls.length > 0 ? frontendUrls : true });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Last-resort net for errors outside any request/pipeline scope, not a
  // recovery path: by the time these fire the process may be in a corrupted
  // state, so log + best-effort alert, then exit fast for a process manager
  // (pm2/systemd `Restart=on-failure`) to restart cleanly — never limp on.
  const logger = new Logger('Process');
  const errorLog = app.get(ErrorLogService);
  const notifications = app.get(NotificationsService);

  const handleFatal = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    logger.error(`fatal: ${message}`, stack);

    withTimeout(
      Promise.all([
        errorLog.record({ message, stack, source: ErrorSource.UNCAUGHT }),
        notifications.notifyAdmins({ title: 'Mollire: erro fatal', body: message }),
      ]),
      3000,
    ).finally(() => process.exit(1));
  };

  process.on('uncaughtException', handleFatal);
  process.on('unhandledRejection', handleFatal);

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
}

bootstrap();
