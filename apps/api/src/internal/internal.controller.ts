import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthenticatedUser } from '../auth/types';
import { CurrentUser } from '../auth/current-user.decorator';
import { Public } from '../auth/public.decorator';
import { InternalService } from './internal.service';

@Controller('internal')
export class InternalController {
  constructor(private readonly internalService: InternalService) {}

  // Called only by Nginx auth_request — responds with status code only.
  // @Public() so the guard doesn't throw on missing session; it still
  // hydrates request.user when a valid cookie is present.
  @Public()
  @Get('auth')
  async checkAccess(
    @Query('slug') slug: string,
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Res() res: Response,
  ) {
    if (!slug) return res.status(400).end();

    const result = await this.internalService.checkAccess(slug, user);

    if (result === 'ok') return res.status(200).end();
    if (result === 'unauthorized') return res.status(401).end();
    return res.status(403).end();
  }
}
