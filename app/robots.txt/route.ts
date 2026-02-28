import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://otaapartments.com';
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkin
Disallow: /api

Sitemap: ${appUrl.replace(/\/$/, '')}/sitemap.xml
`;

  return new NextResponse(body, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
