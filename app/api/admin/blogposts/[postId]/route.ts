import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const patchSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  excerpt: z.string().max(500).optional().nullable(),
  content: z.string().min(1).max(20000).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  seoTitle: z.string().max(200).optional().nullable(),
  seoDescription: z.string().max(300).optional().nullable(),
  ogImage: z.string().max(500).optional().nullable(),
});

export async function PATCH(req: Request, context: { params: Promise<{ postId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { postId } = await context.params;
  const prisma = getPrisma();
  const body = patchSchema.parse(await req.json());

  const updated = await prisma.blogPost.update({
    where: { id: postId },
    data: {
      title: body.title,
      excerpt: body.excerpt === null ? null : body.excerpt,
      content: body.content,
      status: body.status,
      publishedAt: body.status === 'PUBLISHED' ? new Date() : body.status === 'DRAFT' ? null : undefined,
      seoTitle: body.seoTitle === null ? null : body.seoTitle,
      seoDescription: body.seoDescription === null ? null : body.seoDescription,
      ogImage: body.ogImage === null ? null : body.ogImage,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'BLOG_UPDATE',
    entityType: 'BlogPost',
    entityId: updated.id,
    metadata: { status: updated.status },
  });

  return NextResponse.json({ post: updated });
}

