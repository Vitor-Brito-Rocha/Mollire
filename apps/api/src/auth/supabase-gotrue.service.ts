import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Session } from './session-cookie';

type GoTrueError = { msg?: string; message?: string; error_description?: string; error?: string };

// Thin client for Supabase Auth (GoTrue). Login goes through the API — not the
// browser — so the API can put the session in httpOnly cookies of its own
// origin; the browser never holds a token.
@Injectable()
export class SupabaseGoTrueService {
  private readonly baseUrl: string;
  private readonly anonKey: string;

  constructor(config: ConfigService) {
    this.baseUrl = `${config.getOrThrow<string>('SUPABASE_PROJECT_URL')}/auth/v1`;
    this.anonKey = config.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  signIn(email: string, password: string): Promise<Session> {
    return this.call('/token?grant_type=password', { email, password });
  }

  refresh(refreshToken: string): Promise<Session> {
    return this.call('/token?grant_type=refresh_token', { refresh_token: refreshToken });
  }

  // Exchanges the token_hash from an email link (signup / recovery) for a session.
  verify(type: string, tokenHash: string): Promise<Session> {
    return this.call('/verify', { type, token_hash: tokenHash });
  }

  async signUp(email: string, password: string): Promise<void> {
    await this.call('/signup', { email, password });
  }

  async recover(email: string, redirectTo: string): Promise<void> {
    await this.call(`/recover?redirect_to=${encodeURIComponent(redirectTo)}`, { email });
  }

  async updatePassword(accessToken: string, password: string): Promise<void> {
    await this.call('/user', { password }, { method: 'PUT', accessToken });
  }

  async signOut(accessToken: string): Promise<void> {
    await this.call('/logout', undefined, { accessToken }).catch(() => undefined);
  }

  getOAuthUrl(provider: string, redirectTo: string): string {
    const url = new URL(`${this.baseUrl}/authorize`);
    url.searchParams.set('provider', provider);
    url.searchParams.set('redirect_to', redirectTo);
    return url.toString();
  }

  private async call<T = Session>(
    path: string,
    body?: unknown,
    options: { method?: string; accessToken?: string } = {},
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        method: options.method ?? 'POST',
        headers: {
          apikey: this.anonKey,
          Authorization: `Bearer ${options.accessToken ?? this.anonKey}`,
          'Content-Type': 'application/json',
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new HttpException('auth provider unreachable', 502);
    }

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as GoTrueError;
      const message = error.msg ?? error.message ?? error.error_description ?? error.error ?? 'auth failed';
      // 4xx from GoTrue are the caller's (bad credentials, weak password, rate
      // limit) and safe to surface as-is; anything else is our upstream failing.
      throw new HttpException(message, response.status >= 400 && response.status < 500 ? response.status : 502);
    }

    return (response.status === 204 ? undefined : await response.json().catch(() => undefined)) as T;
  }
}
