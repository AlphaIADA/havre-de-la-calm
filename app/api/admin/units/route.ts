import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const createSchema = z.object({
  propertyId: z.string().min(1),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only'),
  name: z.string().min(2).max(200),
  summary: z.string().max(500).optional().nullable(),
  maxGuests: z.number().int().min(1).max(30),
  minNights: z.number().int().min(1).max(30).optional(),
  baseNightly: z.number().int().min(0).max(10_000_000),
  weekendNightly: z.number().int().min(0).max(10_000_000).optional().nullable(),
  cleaningFee: z.number().int().min(0).max(10_000_000).optional(),
  depositFee: z.number().int().min(0).max(10_000_000).optional(),
  images: z.array(z.string().max(500)).optional(),
  amenities: z.array(z.string().max(100)).optional(),
  rules: z.array(z.string().max(200)).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const { response } = await requireStaffApi();
  if (response) return response;

  const prisma = getPrisma();
  const units = await prisma.unit.findMany({
    include: { property: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ units });
}

export async function POST(req: Request) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const prisma = getPrisma();
  const body = createSchema.parse(await req.json());

  const created = await prisma.unit.create({
    data: {
      propertyId: body.propertyId,
      slug: body.slug,
      name: body.name,
      summary: body.summary ?? undefined,
      maxGuests: body.maxGuests,
      minNights: body.minNights ?? 1,
      baseNightly: body.baseNightly,
      weekendNightly: body.weekendNightly ?? undefined,
      cleaningFee: body.cleaningFee ?? 0,
      depositFee: body.depositFee ?? 0,
      images: body.images ?? undefined,
      amenities: body.amenities ?? undefined,
      rules: body.rules ?? undefined,
      active: body.active ?? true,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'UNIT_CREATE',
    entityType: 'Unit',
    entityId: created.id,
    metadata: { slug: created.slug },
  });

  return NextResponse.json({ unit: created }, { status: 201 });
}

