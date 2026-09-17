import { Injectable, Logger } from '@nestjs/common';
import { ErrorSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type RecordInput = {
  message: string;
  stack?: string;
  status_code?: number;
  method?: string;
  path?: string;
  source: ErrorSource;
  user_id?: string;
};

@Injectable()
export class ErrorLogService {
  private readonly logger = new Logger(ErrorLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Never rejects — a logging call failing must never break the error path calling it.
  async record(input: RecordInput): Promise<void> {
    try {
      await this.prisma.errorLog.create({ data: input });
    } catch (err) {
      this.logger.error('failed to persist ErrorLog row', err as Error);
    }
  }
}
