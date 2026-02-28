import { NextResponse } from 'next/server';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

export async function DELETE(req: Request, context: { params: Promise<{ blockId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { blockId } = await context.params;
  const prisma = getPrisma();

  await prisma.availabilityBlock.delete({ where: { id: blockId } });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'AVAILABILITY_BLOCK_DELETE',
    entityType: 'AvailabilityBlock',
    entityId: blockId,
  });

  return NextResponse.json({ ok: true });
}

