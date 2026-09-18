import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hardenCookie } from '@/lib/supabase/cookies';

// Rotas legíveis sem login. A galeria e as páginas de projeto público
// existem justamente para serem vistas por quem não tem conta, então elas
// saem antes de qualquer trabalho de sessão — um visitante anônimo não tem
// token para renovar.
const PUBLIC_PREFIXES = ['/galeria'];

export async function proxy(request: NextRequest) {
  if (PUBLIC_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, hardenCookie(options)),
          );
        },
      },
    },
  );

  // Also refreshes an expiring session token — this call is what makes token
  // refresh work at all for Server Components, which can't write cookies themselves.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname.startsWith('/forgot-password');
  // /reset-password needs the recovery session (set by /auth/confirm) to be
  // reachable at all, so it can't redirect unauthenticated visitors to /login
  // like the other auth routes — but a logged-in user landing there via a
  // stale link shouldn't get bounced back to / either, since they're there
  // specifically to change their password.
  const isPasswordRecoveryRoute = request.nextUrl.pathname.startsWith('/reset-password');
  const isAuthCallbackRoute = request.nextUrl.pathname.startsWith('/auth/confirm');

  // /api/proxy carries public API routes too (the gallery, thumbnails), and a
  // 401 from the API is the right answer to an anonymous call there — not a
  // redirect to /login. It still ran the refresh above, which is what matters.
  const isApiProxy = request.nextUrl.pathname.startsWith('/api/proxy');

  if (!user && !isApiProxy && !isAuthRoute && !isPasswordRecoveryRoute && !isAuthCallbackRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
