import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const schema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  reviewNotes: z.string().max(2000).optional().nullable(),
});

export async function PATCH(req: Request, context: { params: Promise<{ docId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { docId } = await context.params;
  const prisma = getPrisma();
  const body = schema.parse(await req.json());

  const updated = await prisma.kycDocument.update({
    where: { id: docId },
    data: {
      status: body.status,
      reviewNotes: body.reviewNotes === null ? null : body.reviewNotes,
      reviewedAt: new Date(),
      reviewedById: session!.userId,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'KYC_DOCUMENT_REVIEW',
    entityType: 'KycDocument',
    entityId: updated.id,
    metadata: { status: updated.status, kind: updated.kind },
  });

  return NextResponse.json({ document: updated });
}

