import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const createSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only'),
  title: z.string().min(2).max(200),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).max(20000),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
  ogImage: z.string().max(500).optional().nullable(),
});

export async function GET() {
  const { response } = await requireStaffApi();
  if (response) return response;
  const prisma = getPrisma();
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ posts });
}

export async function POST(req: Request) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const prisma = getPrisma();
  const body = createSchema.parse(await req.json());

  const status = body.status ?? 'DRAFT';
  const created = await prisma.blogPost.create({
    data: {
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt ?? undefined,
      content: body.content,
      status,
      publishedAt: status === 'PUBLISHED' ? new Date() : null,
      seoTitle: body.seoTitle ?? undefined,
      seoDescription: body.seoDescription ?? undefined,
      ogImage: body.ogImage ?? undefined,
      createdById: session!.userId,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'BLOG_CREATE',
    entityType: 'BlogPost',
    entityId: created.id,
    metadata: { slug: created.slug, status: created.status },
  });

  return NextResponse.json({ post: created }, { status: 201 });
}

