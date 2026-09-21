import { Controller, Get, Header } from '@nestjs/common';
import { Public } from '../auth/public.decorator';
import { XP_RULES } from './xp.rules';

@Controller('xp')
export class XpController {
  // Constants, not a table — a day of caching is safe, they only change on deploy.
  @Public()
  @Get('rules')
  @Header('Cache-Control', 'public, max-age=86400')
  rules() {
    return XP_RULES;
  }
}
