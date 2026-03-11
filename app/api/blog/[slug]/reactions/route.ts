import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';

const schema = z.object({
  emoji: z.enum(['👍', '❤️', '🎉', '😄', '😮']),
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
    select: { id: true },
  });
  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

  await prisma.blogReaction.upsert({
    where: { postId_emoji: { postId: post.id, emoji: data.emoji } },
    create: { postId: post.id, emoji: data.emoji, count: 1 },
    update: { count: { increment: 1 } },
  });

  const reactions = await prisma.blogReaction.findMany({
    where: { postId: post.id },
    select: { emoji: true, count: true },
    orderBy: [{ count: 'desc' }, { emoji: 'asc' }],
  });

  return NextResponse.json({ reactions }, { status: 201 });
}

