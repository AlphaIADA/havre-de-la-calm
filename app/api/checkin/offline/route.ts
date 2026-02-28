import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';
import { parseDateOnly } from '@/lib/dateOnly';
import { calculatePrice } from '@/lib/pricing';
import { generateUniqueBookingCode } from '@/lib/bookingCode';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  unitSlug: z.string().min(1),
  propertySlug: z.string().min(1).optional(),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  guestName: z.string().min(2).max(200),
  guestEmail: z.string().email().max(320).optional().nullable(),
  guestPhone: z.string().min(5).max(50),
  address: z.string().max(500).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  nextOfKinName: z.string().max(200).optional().nullable(),
  nextOfKinPhone: z.string().max(50).optional().nullable(),
  emergencyName: z.string().max(200).optional().nullable(),
  emergencyPhone: z.string().max(50).optional().nullable(),
  termsAccepted: z.boolean().optional(),
  signatureText: z.string().max(200).optional().nullable(),
});

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const data = schema.parse(await req.json());
  const prisma = getPrisma();

  const unit = await prisma.unit.findUnique({
    where: { slug: data.unitSlug },
    include: { property: true },
  });
  if (!unit) return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
  if (data.propertySlug && unit.property.slug !== data.propertySlug) {
    return NextResponse.json({ error: 'Unit does not belong to property' }, { status: 400 });
  }

  const checkIn = parseDateOnly(data.checkIn);
  const checkOut = parseDateOnly(data.checkOut);
  if (!checkIn || !checkOut) return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
  if (checkOut <= checkIn) return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });

  const guestsTotal = data.adults + data.children;
  if (guestsTotal > unit.maxGuests) {
    return NextResponse.json({ error: `Max guests for this unit is ${unit.maxGuests}` }, { status: 400 });
  }

  const breakdown = calculatePrice({
    checkIn,
    checkOut,
    baseNightly: unit.baseNightly,
    weekendNightly: unit.weekendNightly,
    cleaningFee: unit.cleaningFee,
    depositFee: unit.depositFee,
  });
  if (breakdown.nights < unit.minNights) {
    return NextResponse.json({ error: `Minimum stay is ${unit.minNights} nights` }, { status: 400 });
  }

  const blocked = await prisma.availabilityBlock.findFirst({
    where: { unitId: unit.id, startDate: { lt: checkOut }, endDate: { gt: checkIn } },
  });
  if (blocked) return NextResponse.json({ error: 'Selected dates are unavailable' }, { status: 409 });

  const conflict = await prisma.booking.findFirst({
    where: {
      unitId: unit.id,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
  if (conflict) return NextResponse.json({ error: 'Selected dates are unavailable' }, { status: 409 });

  const code = await generateUniqueBookingCode(prisma);

  const now = new Date();
  const status = checkIn <= now && checkOut > now ? 'CHECKED_IN' : 'CONFIRMED';

  const booking = await prisma.booking.create({
    data: {
      code,
      source: 'OFFLINE',
      status,
      payMode: 'PAY_LATER',
      currency: 'NGN',
      propertyId: unit.propertyId,
      unitId: unit.id,
      checkIn,
      checkOut,
      nights: breakdown.nights,
      adults: data.adults,
      children: data.children,
      nightlyTotal: breakdown.nightlyTotal,
      cleaningFee: breakdown.cleaningFee,
      depositFee: breakdown.depositFee,
      totalAmount: breakdown.total,
      guestName: data.guestName,
      guestEmail: data.guestEmail ?? `${code}@guest.local`,
      guestPhone: data.guestPhone,
      kycProfile: {
        create: {
          status: 'PENDING',
          fullName: data.guestName,
          email: data.guestEmail ?? `${code}@guest.local`,
          phone: data.guestPhone,
          address: data.address ?? undefined,
          nationality: data.nationality ?? undefined,
          nextOfKinName: data.nextOfKinName ?? undefined,
          nextOfKinPhone: data.nextOfKinPhone ?? undefined,
          emergencyName: data.emergencyName ?? undefined,
          emergencyPhone: data.emergencyPhone ?? undefined,
          termsAcceptedAt: data.termsAccepted ? new Date() : undefined,
          signatureText: data.signatureText ?? undefined,
        },
      },
    },
    select: { code: true, status: true },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: 'Offline check-in submitted — OTA Apartments',
      html: `<p>Offline booking created.</p>
<p><strong>Code:</strong> ${booking.code}</p>
<p><strong>Guest:</strong> ${data.guestName} (${data.guestPhone})</p>
<p><strong>Stay:</strong> ${unit.property.name} — ${unit.name}</p>
<p><strong>Dates:</strong> ${data.checkIn} → ${data.checkOut}</p>`,
    });
  }

  return NextResponse.json({ bookingCode: booking.code, status: booking.status }, { status: 201 });
}
