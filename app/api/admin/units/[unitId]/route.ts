import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  summary: z.string().max(500).optional().nullable(),
  maxGuests: z.number().int().min(1).max(30).optional(),
  minNights: z.number().int().min(1).max(30).optional(),
  baseNightly: z.number().int().min(0).max(10_000_000).optional(),
  weekendNightly: z.number().int().min(0).max(10_000_000).optional().nullable(),
  cleaningFee: z.number().int().min(0).max(10_000_000).optional(),
  depositFee: z.number().int().min(0).max(10_000_000).optional(),
  images: z.array(z.string().max(500)).optional(),
  amenities: z.array(z.string().max(100)).optional(),
  rules: z.array(z.string().max(200)).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: Request, context: { params: Promise<{ unitId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { unitId } = await context.params;
  const prisma = getPrisma();
  const body = updateSchema.parse(await req.json());

  const updated = await prisma.unit.update({
    where: { id: unitId },
    data: {
      name: body.name,
      summary: body.summary === null ? null : body.summary,
      maxGuests: body.maxGuests,
      minNights: body.minNights,
      baseNightly: body.baseNightly,
      weekendNightly: body.weekendNightly === null ? null : body.weekendNightly,
      cleaningFee: body.cleaningFee,
      depositFee: body.depositFee,
      images: body.images,
      amenities: body.amenities,
      rules: body.rules,
      active: body.active,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'UNIT_UPDATE',
    entityType: 'Unit',
    entityId: updated.id,
  });

  return NextResponse.json({ unit: updated });
}

