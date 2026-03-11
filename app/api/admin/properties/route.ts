import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const createSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only'),
  name: z.string().min(2).max(200),
  location: z.string().min(2).max(200),
  description: z.string().min(10).max(2000),
  address: z.string().max(500).optional().nullable(),
  heroImage: z.string().max(500).optional().nullable(),
  gallery: z.array(z.string().max(500)).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  const { response } = await requireStaffApi();
  if (response) return response;

  const prisma = getPrisma();
  const properties = await prisma.property.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ properties });
}

export async function POST(req: Request) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const prisma = getPrisma();
  const body = createSchema.parse(await req.json());

  const created = await prisma.property.create({
    data: {
      slug: body.slug,
      name: body.name,
      location: body.location,
      description: body.description,
      address: body.address ?? undefined,
      heroImage: body.heroImage ?? undefined,
      gallery: body.gallery ?? undefined,
      active: body.active ?? true,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'PROPERTY_CREATE',
    entityType: 'Property',
    entityId: created.id,
    metadata: { slug: created.slug },
  });

  return NextResponse.json({ property: created }, { status: 201 });
}
