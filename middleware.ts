import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function isCheckinHost(host: string) {
  const h = host.toLowerCase();
  return h.startsWith('checkin.');
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const { pathname } = req.nextUrl;

  if (isCheckinHost(host)) {
    if (pathname === '/') {
      const url = req.nextUrl.clone();
      url.pathname = '/checkin';
      return NextResponse.rewrite(url);
    }

    if (!pathname.startsWith('/checkin')) {
      const url = req.nextUrl.clone();
      url.pathname = `/checkin${pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*).*)'],
};

