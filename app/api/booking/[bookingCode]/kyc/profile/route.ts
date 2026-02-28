import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';

const updateSchema = z.object({
  address: z.string().max(500).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  nextOfKinName: z.string().max(200).optional().nullable(),
  nextOfKinPhone: z.string().max(50).optional().nullable(),
  emergencyName: z.string().max(200).optional().nullable(),
  emergencyPhone: z.string().max(50).optional().nullable(),
  termsAccepted: z.boolean().optional(),
  signatureText: z.string().max(200).optional().nullable(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ bookingCode: string }> },
) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const { bookingCode } = await context.params;
  const prisma = getPrisma();

  const booking = await prisma.booking.findUnique({
    where: { code: bookingCode },
    include: { kycProfile: true },
  });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const body = updateSchema.parse(await req.json());

  const profileId =
    booking.kycProfile?.id ??
    (
      await prisma.kycProfile.create({
        data: {
          bookingId: booking.id,
          status: 'PENDING',
          fullName: booking.guestName,
          email: booking.guestEmail,
          phone: booking.guestPhone,
        },
        select: { id: true },
      })
    ).id;

  const updated = await prisma.kycProfile.update({
    where: { id: profileId },
    data: {
      address: body.address ?? undefined,
      nationality: body.nationality ?? undefined,
      nextOfKinName: body.nextOfKinName ?? undefined,
      nextOfKinPhone: body.nextOfKinPhone ?? undefined,
      emergencyName: body.emergencyName ?? undefined,
      emergencyPhone: body.emergencyPhone ?? undefined,
      signatureText: body.signatureText ?? undefined,
      termsAcceptedAt: body.termsAccepted ? new Date() : undefined,
    },
  });

  return NextResponse.json({ profile: updated });
}

