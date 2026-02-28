import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const patchSchema = z.object({
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, context: { params: Promise<{ promoCodeId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { promoCodeId } = await context.params;
  const prisma = getPrisma();
  const body = patchSchema.parse(await req.json());

  const updated = await prisma.promoCode.update({
    where: { id: promoCodeId },
    data: { active: body.active },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'PROMO_UPDATE',
    entityType: 'PromoCode',
    entityId: updated.id,
  });

  return NextResponse.json({ promoCode: updated });
}

