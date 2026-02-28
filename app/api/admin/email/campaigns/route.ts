import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const createSchema = z.object({
  name: z.string().min(2).max(200),
  subject: z.string().min(2).max(200),
  html: z.string().min(1).max(20000),
  segmentId: z.string().optional().nullable(),
});

export async function GET() {
  const { response } = await requireStaffApi();
  if (response) return response;
  const prisma = getPrisma();
  const campaigns = await prisma.emailCampaign.findMany({
    include: { segment: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ campaigns });
}

export async function POST(req: Request) {
  const { session, response } = await requireStaffApi();
  if (response) return response;
  const prisma = getPrisma();
  const body = createSchema.parse(await req.json());
  const campaign = await prisma.emailCampaign.create({
    data: {
      name: body.name,
      subject: body.subject,
      html: body.html,
      segmentId: body.segmentId ?? undefined,
      status: 'DRAFT',
    },
  });
  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'EMAIL_CAMPAIGN_CREATE',
    entityType: 'EmailCampaign',
    entityId: campaign.id,
  });
  return NextResponse.json({ campaign }, { status: 201 });
}

