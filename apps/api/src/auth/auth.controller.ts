import {
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ConfirmDto, CredentialsDto, EmailDto, PasswordDto } from './dto/auth.dto';
import { isAllowedOrigin } from './frontend-origins';
import { Public } from './public.decorator';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  readCookie,
  setSessionCookies,
} from './session-cookie';
import { SupabaseGoTrueService } from './supabase-gotrue.service';

// Every endpoint here is called by the browser and either sets or relies on the
// session cookie, so each one insists on an allowed Origin: without that, any
// page could log a visitor into an attacker's account (login CSRF) or trigger
// these calls with the visitor's cookie.
function allowedOrigin(req: Request): string {
  if (!isAllowedOrigin(req.headers.origin)) {
    throw new ForbiddenException('origin not allowed');
  }
  return req.headers.origin;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly gotrue: SupabaseGoTrueService) {}

  @Public()
  @Post('login')
  @HttpCode(204)
  async login(
    @Body() dto: CredentialsDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    allowedOrigin(req);
    setSessionCookies(res, await this.gotrue.signIn(dto.email, dto.password));
  }

  @Public()
  @Post('signup')
  @HttpCode(204)
  async signup(@Body() dto: CredentialsDto, @Req() req: Request) {
    allowedOrigin(req);
    await this.gotrue.signUp(dto.email, dto.password);
  }

  // Swaps the refresh cookie for a fresh pair. The web client calls this when
  // the API answers 401 because the short-lived access cookie expired.
  @Public()
  @Post('refresh')
  @HttpCode(204)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    allowedOrigin(req);
    const refreshToken = readCookie(req.headers.cookie, REFRESH_COOKIE);
    if (!refreshToken) throw new UnauthorizedException('missing session');

    try {
      setSessionCookies(res, await this.gotrue.refresh(refreshToken));
    } catch (error) {
      clearSessionCookies(res);
      throw error;
    }
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    allowedOrigin(req);
    const accessToken = readCookie(req.headers.cookie, ACCESS_COOKIE);
    clearSessionCookies(res);
    if (accessToken) await this.gotrue.signOut(accessToken);
  }

  @Public()
  @Post('forgot')
  @HttpCode(204)
  async forgot(@Body() dto: EmailDto, @Req() req: Request) {
    const origin = allowedOrigin(req);
    await this.gotrue.recover(dto.email, `${origin}/reset-password`);
  }

  // Target of the links in the signup / recovery emails (through the web app's
  // /auth/confirm page): trades the token_hash for a session.
  @Public()
  @Post('confirm')
  @HttpCode(204)
  async confirm(
    @Body() dto: ConfirmDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    allowedOrigin(req);
    setSessionCookies(res, await this.gotrue.verify(dto.type, dto.token_hash));
  }

  // Not @Public: the global guard authenticates the caller (cookie or Bearer),
  // which is exactly what a password change after login or recovery needs.
  @Put('password')
  @HttpCode(204)
  async password(@Body() dto: PasswordDto, @Req() req: Request) {
    const authHeader = req.headers.authorization;
    const accessToken =
      (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined) ??
      readCookie(req.headers.cookie, ACCESS_COOKIE);
    if (!accessToken) throw new UnauthorizedException('missing session');
    await this.gotrue.updatePassword(accessToken, dto.password);
  }
}
