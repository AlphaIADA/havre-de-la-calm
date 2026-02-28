import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const createSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(40)
      .regex(/^[A-Z0-9_-]+$/, 'Use uppercase letters and numbers only'),
    type: z.enum(['PERCENT', 'FIXED']),
    amount: z.number().int().min(1).max(10_000_000),
    maxRedemptions: z.number().int().min(1).max(1_000_000).optional().nullable(),
    expiresAt: z.string().optional().nullable(), // YYYY-MM-DD
    propertyId: z.string().optional().nullable(),
    unitId: z.string().optional().nullable(),
  })
  .refine((v) => (v.type === 'PERCENT' ? v.amount <= 100 : true), {
    message: 'Percent promo must be 100 or less',
    path: ['amount'],
  });

export async function GET() {
  const { response } = await requireStaffApi();
  if (response) return response;

  const prisma = getPrisma();
  const promoCodes = await prisma.promoCode.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ promoCodes });
}

export async function POST(req: Request) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const prisma = getPrisma();
  const body = createSchema.parse(await req.json());

  const expiresAt = body.expiresAt ? new Date(`${body.expiresAt}T23:59:59.999Z`) : undefined;

  const created = await prisma.promoCode.create({
    data: {
      code: body.code,
      type: body.type,
      amount: body.amount,
      maxRedemptions: body.maxRedemptions ?? undefined,
      expiresAt,
      propertyId: body.propertyId ?? undefined,
      unitId: body.unitId ?? undefined,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'PROMO_CREATE',
    entityType: 'PromoCode',
    entityId: created.id,
    metadata: { code: created.code },
  });

  return NextResponse.json({ promoCode: created }, { status: 201 });
}
