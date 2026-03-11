import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';

const updateSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  location: z.string().min(2).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  address: z.string().max(500).optional().nullable(),
  heroImage: z.string().max(500).optional().nullable(),
  gallery: z.array(z.string().max(500)).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ propertyId: string }> },
) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { propertyId } = await context.params;
  const prisma = getPrisma();
  const body = updateSchema.parse(await req.json());

  const updated = await prisma.property.update({
    where: { id: propertyId },
    data: {
      name: body.name,
      location: body.location,
      description: body.description,
      address: body.address === null ? null : body.address,
      heroImage: body.heroImage === null ? null : body.heroImage,
      gallery: body.gallery,
      active: body.active,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'PROPERTY_UPDATE',
    entityType: 'Property',
    entityId: updated.id,
  });

  return NextResponse.json({ property: updated });
}
