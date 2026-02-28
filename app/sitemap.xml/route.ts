import { NextResponse } from 'next/server';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';
import { demoProperties, demoUnits } from '@/lib/demoData';
import { demoBlogPosts } from '@/lib/demoBlog';

export const dynamic = 'force-dynamic';

function xmlEscape(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://otaapartments.com').replace(/\/$/, '');

  const staticUrls = ['/', '/properties', '/blog', '/contact', '/privacy', '/terms', '/ota', '/sango-ota'];

  let propertySlugs: string[] = demoProperties.map((p) => p.slug);
  let unitSlugs: string[] = demoUnits.map((u) => u.slug);
  let blogSlugs: string[] = demoBlogPosts.map((p) => p.slug);

  if (isDbConfigured()) {
    const prisma = getPrisma();
    const [properties, units, posts] = await Promise.all([
      prisma.property.findMany({ where: { active: true }, select: { slug: true } }),
      prisma.unit.findMany({ where: { active: true }, select: { slug: true } }),
      prisma.blogPost.findMany({ where: { status: 'PUBLISHED' }, select: { slug: true } }),
    ]);
    propertySlugs = properties.map((p) => p.slug);
    unitSlugs = units.map((u) => u.slug);
    blogSlugs = posts.map((p) => p.slug);
  }

  const urls = [
    ...staticUrls.map((p) => `${base}${p}`),
    ...propertySlugs.map((slug) => `${base}/properties/${slug}`),
    ...unitSlugs.map((slug) => `${base}/stay/${slug}`),
    ...unitSlugs.map((slug) => `${base}/book/${slug}`),
    ...blogSlugs.map((slug) => `${base}/blog/${slug}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((loc) => `  <url><loc>${xmlEscape(loc)}</loc></url>`)
  .join('\\n')}
</urlset>
`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=3600',
    },
  });
}
