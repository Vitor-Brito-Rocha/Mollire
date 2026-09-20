import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
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
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!slug) return res.status(400).end();

    const { result, projectId } = await this.internalService.checkAccess(slug, user);

    const uri = (req.headers['x-original-uri'] as string) ?? '/';
    const accept = (req.headers['x-accept'] as string) ?? '';
    const isPageRequest = accept.includes('text/html');

    const existingVid = req.cookies?.['_mollire_vid'] || undefined;
    const visitorId = existingVid ?? (isPageRequest ? randomUUID() : '');
    const ip = req.headers['x-forwarded-for'] as string | undefined;

    res.set('X-Auth-Result', result);
    if (visitorId) res.set('X-Visitor-Id', visitorId);

    if (result === 'ok') {
      if (isPageRequest && visitorId) this.internalService.trackView(projectId!, visitorId, uri, ip);
      return res.status(200).end();
    }

    if (result === 'unauthorized') return res.status(401).end();
    return res.status(403).end(); // both 'forbidden' and 'not_found' — differentiated via X-Auth-Result header
  }
}
