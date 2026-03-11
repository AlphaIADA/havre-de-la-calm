import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { writeAuditLog } from '@/lib/audit';
import { getPrisma } from '@/lib/prisma';

const patchSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'HIDDEN']),
});

export async function PATCH(req: Request, context: { params: Promise<{ commentId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { commentId } = await context.params;
  const data = patchSchema.parse(await req.json());
  const prisma = getPrisma();

  const updated = await prisma.blogComment.update({
    where: { id: commentId },
    data: {
      status: data.status,
      approvedAt: data.status === 'APPROVED' ? new Date() : null,
      moderatedById: session!.userId,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'BLOG_COMMENT_UPDATE',
    entityType: 'BlogComment',
    entityId: updated.id,
    metadata: { status: updated.status },
  });

  return NextResponse.json({ comment: updated });
}

export async function DELETE(req: Request, context: { params: Promise<{ commentId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { commentId } = await context.params;
  const prisma = getPrisma();

  const deleted = await prisma.blogComment.delete({ where: { id: commentId } });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'BLOG_COMMENT_DELETE',
    entityType: 'BlogComment',
    entityId: deleted.id,
  });

  return NextResponse.json({ ok: true });
}

