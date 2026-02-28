import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const createSchema = z.object({
  unitId: z.string().min(1),
  startDate: z.string().min(1), // YYYY-MM-DD
  endDate: z.string().min(1), // YYYY-MM-DD
  reason: z.string().max(500).optional().nullable(),
});

export async function GET() {
  const { response } = await requireStaffApi();
  if (response) return response;
  const prisma = getPrisma();
  const blocks = await prisma.availabilityBlock.findMany({
    include: { unit: { include: { property: true } } },
    orderBy: { startDate: 'desc' },
    take: 200,
  });
  return NextResponse.json({ blocks });
}

export async function POST(req: Request) {
  const { session, response } = await requireStaffApi();
  if (response) return response;
  const prisma = getPrisma();
  const body = createSchema.parse(await req.json());

  const startDate = new Date(`${body.startDate}T00:00:00.000Z`);
  const endDate = new Date(`${body.endDate}T00:00:00.000Z`);
  if (!(startDate < endDate)) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
  }

  const block = await prisma.availabilityBlock.create({
    data: {
      unitId: body.unitId,
      startDate,
      endDate,
      reason: body.reason ?? undefined,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'AVAILABILITY_BLOCK_CREATE',
    entityType: 'AvailabilityBlock',
    entityId: block.id,
  });

  return NextResponse.json({ block }, { status: 201 });
}

