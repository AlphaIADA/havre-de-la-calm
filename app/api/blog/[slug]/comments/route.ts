import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  name: z.string().min(2).max(200),
  email: z.string().email().max(320).optional().nullable(),
  body: z.string().min(1).max(2000),
});

export async function POST(req: Request, context: { params: Promise<{ slug: string }> }) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { slug } = await context.params;
  const data = schema.parse(await req.json());
  const prisma = getPrisma();

  const post = await prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: { id: true, title: true, slug: true },
  });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  const created = await prisma.blogComment.create({
    data: {
      postId: post.id,
      status: 'PENDING',
      name: data.name.trim(),
      email: data.email?.trim() || null,
      body: data.body.trim(),
    },
    select: { id: true },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `New blog comment (pending) — ${post.title}`,
      html: `<p>New blog comment awaiting moderation.</p>
<p><strong>Post:</strong> ${post.title}</p>
<p><strong>From:</strong> ${data.name}${data.email ? ` (${data.email})` : ''}</p>
<p>${data.body.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>
<p>Moderate: <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/blog/comments">Open comments</a></p>`,
    });
  }

  return NextResponse.json({ commentId: created.id }, { status: 201 });
}

