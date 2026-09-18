import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { frontendOrigins } from './frontend-origins';
import { IS_PUBLIC_KEY } from './public.decorator';
import { readSessionToken } from './session-cookie';
import { SupabaseAuthService } from './supabase-auth.service';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: SupabaseAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    // The browser authenticates with the httpOnly session cookie; a Bearer
    // header stays supported for non-browser callers (scripts, local tools).
    const cookieToken = bearer ? undefined : readSessionToken(request.headers.cookie);
    const token = bearer ?? cookieToken;

    // A cookie is attached by the browser to anything that asks, including
    // pages on sibling subdomains (users' published sites live under this
    // domain), so a cookie-authenticated write must come from our own web
    // origin. Bearer callers set the header themselves and can't be tricked.
    if (cookieToken && !SAFE_METHODS.has(request.method)) {
      const origin: string | undefined = request.headers.origin;
      if (!origin || !frontendOrigins().includes(origin)) {
        throw new ForbiddenException('origin not allowed');
      }
    }

    if (isPublic) {
      // A public route still recognises a signed-in caller (the gallery marks
      // the viewer's own stars), but a missing or bad token just means
      // "anonymous" here — never a 401.
      if (token) {
        try {
          request.user = await this.authService.verifyAndSync(token);
        } catch {
          request.user = undefined;
        }
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException('missing session');
    }

    request.user = await this.authService.verifyAndSync(token);
    return true;
  }
}
