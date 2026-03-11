import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const patchSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[A-Z0-9_-]+$/, 'Use uppercase letters and numbers only')
    .optional(),
  type: z.enum(['PERCENT', 'FIXED']).optional(),
  amount: z.number().int().min(1).max(10_000_000).optional(),
  maxRedemptions: z.number().int().min(1).max(1_000_000).optional().nullable(),
  expiresAt: z.string().optional().nullable(), // YYYY-MM-DD
  propertyId: z.string().optional().nullable(),
  unitId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, context: { params: Promise<{ promoCodeId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { promoCodeId } = await context.params;
  const prisma = getPrisma();
  const body = patchSchema.parse(await req.json());

  const existing = await prisma.promoCode.findUnique({ where: { id: promoCodeId } });
  if (!existing) {
    return NextResponse.json({ error: 'Promo code not found' }, { status: 404 });
  }

  const nextType = body.type ?? existing.type;
  const nextAmount = body.amount ?? existing.amount;
  if (nextType === 'PERCENT' && nextAmount > 100) {
    return NextResponse.json({ error: 'Percent promo must be 100 or less' }, { status: 400 });
  }

  let unitId: string | null | undefined = body.unitId;
  let propertyId: string | null | undefined = body.propertyId;
  if (body.unitId !== undefined) {
    if (body.unitId) {
      const unit = await prisma.unit.findUnique({ where: { id: body.unitId }, select: { propertyId: true } });
      if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
      unitId = body.unitId;
      propertyId = unit.propertyId;
    } else {
      unitId = null;
    }
  }

  const expiresAt =
    body.expiresAt === undefined ? undefined : body.expiresAt ? new Date(`${body.expiresAt}T23:59:59.999Z`) : null;

  const updated = await prisma.promoCode.update({
    where: { id: promoCodeId },
    data: {
      code: body.code,
      type: body.type,
      amount: body.amount,
      maxRedemptions: body.maxRedemptions === null ? null : body.maxRedemptions,
      expiresAt,
      propertyId: propertyId === undefined ? undefined : propertyId,
      unitId: unitId === undefined ? undefined : unitId,
      active: body.active,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'PROMO_UPDATE',
    entityType: 'PromoCode',
    entityId: updated.id,
    metadata: { code: updated.code, active: updated.active },
  });

  return NextResponse.json({ promoCode: updated });
}

export async function DELETE(req: Request, context: { params: Promise<{ promoCodeId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { promoCodeId } = await context.params;
  const prisma = getPrisma();

  const deleted = await prisma.promoCode.delete({ where: { id: promoCodeId } });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'PROMO_DELETE',
    entityType: 'PromoCode',
    entityId: deleted.id,
    metadata: { code: deleted.code },
  });

  return NextResponse.json({ ok: true });
}
