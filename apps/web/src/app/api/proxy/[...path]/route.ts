import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// The browser never talks to apps/api directly. It calls this same-origin
// route; the session lives in an httpOnly cookie that JS can't read, so it is
// attached here, server-side, as the Bearer token the API expects. This also
// keeps the API's own origin (an ngrok tunnel, today) out of the browser: no
// CORS, and ngrok's interstitial never reaches an <img> or fetch.

const RESPONSE_HEADERS = ['content-type', 'cache-control', 'etag', 'last-modified'];

async function forward(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) {
    return NextResponse.json({ message: 'API_URL is not configured' }, { status: 500 });
  }

  const { path } = await params;
  const target = `${apiUrl.replace(/\/$/, '')}/${path.map(encodeURIComponent).join('/')}${request.nextUrl.search}`;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers({
    // ngrok's free tier answers browser-looking requests with an HTML warning
    // page unless this header is present.
    'ngrok-skip-browser-warning': '1',
  });
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (session) headers.set('authorization', `Bearer ${session.access_token}`);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
  }).catch(() => null);

  if (!upstream) {
    return NextResponse.json({ message: 'API unreachable' }, { status: 502 });
  }

  const responseHeaders = new Headers();
  for (const name of RESPONSE_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  return new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };
