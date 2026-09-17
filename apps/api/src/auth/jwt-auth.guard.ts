import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { SupabaseAuthService } from './supabase-auth.service';

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
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

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
      throw new UnauthorizedException('missing bearer token');
    }

    request.user = await this.authService.verifyAndSync(token);
    return true;
  }
}
