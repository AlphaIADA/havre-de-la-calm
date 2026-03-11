import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function isCheckinHost(host: string) {
  return host.toLowerCase().startsWith('checkin.');
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  if (!isCheckinHost(host)) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/checkin')) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = pathname === '/' ? '/checkin' : `/checkin${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};

