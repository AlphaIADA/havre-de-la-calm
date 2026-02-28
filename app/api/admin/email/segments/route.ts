import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  criteria: z
    .object({
      type: z.enum(['ALL_GUESTS', 'PAST_GUESTS']),
    })
    .passthrough(),
});

export async function GET() {
  const { response } = await requireStaffApi();
  if (response) return response;
  const prisma = getPrisma();
  const segments = await prisma.emailSegment.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ segments });
}

export async function POST(req: Request) {
  const { session, response } = await requireStaffApi();
  if (response) return response;
  const prisma = getPrisma();
  const body = createSchema.parse(await req.json());
  const segment = await prisma.emailSegment.create({
    data: { name: body.name, criteria: body.criteria as Prisma.InputJsonValue },
  });
  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'EMAIL_SEGMENT_CREATE',
    entityType: 'EmailSegment',
    entityId: segment.id,
  });
  return NextResponse.json({ segment }, { status: 201 });
}
