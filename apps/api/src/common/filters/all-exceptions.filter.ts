import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ErrorSource } from '@prisma/client';
import type { Request, Response } from 'express';
import { ErrorLogService } from '../../error-log/error-log.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(
    private readonly errorLog: ErrorLogService,
    private readonly notifications: NotificationsService,
  ) {}

  async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request & { user?: { id: string } }>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof Error ? exception.message : String(exception);
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(`${request.method} ${request.url} -> ${status}: ${message}`, stack);

    // 4xx are expected client-error flow (bad input, not-found, etc.) — console
    // log only. 5xx are unexpected platform bugs: persist + page an admin.
    if (status >= 500) {
      await this.errorLog.record({
        message,
        stack,
        status_code: status,
        method: request.method,
        path: request.originalUrl ?? request.url,
        source: ErrorSource.HTTP,
        user_id: request.user?.id,
      });
      void this.notifications.notifyAdmins({
        title: 'Mollire: erro interno',
        body: `${request.method} ${request.originalUrl ?? request.url} -> ${status}`,
      });
    }

    const body = isHttpException
      ? this.normalizeHttpExceptionBody(exception, status)
      : { status_code: status, message: 'Internal server error' };

    response.status(status).json(body);
  }

  // exception.getResponse() can be a plain string or an arbitrary object shape
  // (ValidationPipe returns {statusCode, message, error} in Nest's own default
  // camelCase) — normalize to this project's snake_case wire format either way.
  private normalizeHttpExceptionBody(exception: HttpException, status: number) {
    const res = exception.getResponse();
    if (typeof res === 'string') {
      return { status_code: status, message: res };
    }
    const { message, error } = res as { message?: unknown; error?: string };
    return { status_code: status, message: message ?? exception.message, error };
  }
}
