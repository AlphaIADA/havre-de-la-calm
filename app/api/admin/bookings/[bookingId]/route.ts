import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { sendEmail } from '@/lib/email';
import { parseDateOnly } from '@/lib/dateOnly';
import { calculatePrice } from '@/lib/pricing';
import { extraChargeSchema, parseExtraCharges } from '@/lib/extraCharges';

const patchSchema = z.object({
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'])
    .optional(),
  notes: z.string().max(2000).optional().nullable(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  adults: z.number().int().min(1).max(20).optional(),
  children: z.number().int().min(0).max(20).optional(),
  nightlyTotal: z.number().int().min(0).max(10_000_000).optional(),
  cleaningFee: z.number().int().min(0).max(10_000_000).optional(),
  depositFee: z.number().int().min(0).max(10_000_000).optional(),
  discountAmount: z.number().int().min(0).max(10_000_000).optional(),
  extraCharges: z
    .array(extraChargeSchema)
    .max(20)
    .optional(),
  recalculatePricing: z.boolean().optional(),
  markOfflinePaymentReceived: z.boolean().optional(),
  paymentAmount: z.number().int().min(0).max(10_000_000).optional(),
  paymentReference: z.string().max(200).optional().nullable(),
});

export async function PATCH(req: Request, context: { params: Promise<{ bookingId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { bookingId } = await context.params;
  const prisma = getPrisma();
  const body = patchSchema.parse(await req.json());

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { unit: true },
  });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const incomingCheckIn = typeof body.checkIn === 'string' ? parseDateOnly(body.checkIn) : null;
  const incomingCheckOut = typeof body.checkOut === 'string' ? parseDateOnly(body.checkOut) : null;
  if ((typeof body.checkIn === 'string' && !incomingCheckIn) || (typeof body.checkOut === 'string' && !incomingCheckOut)) {
    return NextResponse.json({ error: 'Invalid dates' }, { status: 400 });
  }

  const checkInChanged = incomingCheckIn ? incomingCheckIn.getTime() !== booking.checkIn.getTime() : false;
  const checkOutChanged = incomingCheckOut ? incomingCheckOut.getTime() !== booking.checkOut.getTime() : false;
  const datesChanged = checkInChanged || checkOutChanged;
  const guestsChanged = typeof body.adults === 'number' || typeof body.children === 'number';
  const recalc = body.recalculatePricing || datesChanged;

  const nextCheckIn = incomingCheckIn ?? booking.checkIn;
  const nextCheckOut = incomingCheckOut ?? booking.checkOut;
  if (nextCheckOut <= nextCheckIn) {
    return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });
  }

  const nextAdults = typeof body.adults === 'number' ? body.adults : booking.adults;
  const nextChildren = typeof body.children === 'number' ? body.children : booking.children;
  const guestsTotal = nextAdults + nextChildren;
  if (guestsTotal > booking.unit.maxGuests) {
    return NextResponse.json({ error: `Max guests for this unit is ${booking.unit.maxGuests}` }, { status: 400 });
  }

  let computedNightlyTotal = booking.nightlyTotal;
  let computedCleaningFee = booking.cleaningFee;
  let computedDepositFee = booking.depositFee;
  let computedNights = booking.nights;

  if (recalc) {
    const breakdown = calculatePrice({
      checkIn: nextCheckIn,
      checkOut: nextCheckOut,
      baseNightly: booking.unit.baseNightly,
      weekendNightly: booking.unit.weekendNightly,
      cleaningFee: booking.unit.cleaningFee,
      depositFee: booking.unit.depositFee,
    });
    if (breakdown.nights < booking.unit.minNights) {
      return NextResponse.json({ error: `Minimum stay is ${booking.unit.minNights} nights` }, { status: 400 });
    }

    computedNightlyTotal = breakdown.nightlyTotal;
    computedCleaningFee = breakdown.cleaningFee;
    computedDepositFee = breakdown.depositFee;
    computedNights = breakdown.nights;

    if (datesChanged) {
      const blocked = await prisma.availabilityBlock.findFirst({
        where: {
          unitId: booking.unitId,
          startDate: { lt: nextCheckOut },
          endDate: { gt: nextCheckIn },
        },
      });
      if (blocked) return NextResponse.json({ error: 'Selected dates are unavailable (maintenance block).' }, { status: 409 });

      const conflict = await prisma.booking.findFirst({
        where: {
          id: { not: booking.id },
          unitId: booking.unitId,
          status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
          checkIn: { lt: nextCheckOut },
          checkOut: { gt: nextCheckIn },
        },
      });
      if (conflict) return NextResponse.json({ error: 'Selected dates are unavailable.' }, { status: 409 });
    }
  }

  const nextNightlyTotal = typeof body.nightlyTotal === 'number' ? body.nightlyTotal : computedNightlyTotal;
  const nextCleaningFee = typeof body.cleaningFee === 'number' ? body.cleaningFee : computedCleaningFee;
  const nextDepositFee = typeof body.depositFee === 'number' ? body.depositFee : computedDepositFee;
  const existingExtraCharges = parseExtraCharges(booking.extraCharges);
  const nextExtraCharges = body.extraCharges ?? existingExtraCharges;
  const extraChargesTotal = nextExtraCharges.reduce((sum, c) => sum + (Number.isFinite(c.amount) ? c.amount : 0), 0);
  const nextDiscountAmount = Math.min(
    nextNightlyTotal,
    typeof body.discountAmount === 'number' ? body.discountAmount : booking.discountAmount,
  );
  const nextTotalAmount = Math.max(
    0,
    nextNightlyTotal - nextDiscountAmount + nextCleaningFee + nextDepositFee + extraChargesTotal,
  );

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: body.status,
      notes: body.notes === null ? null : body.notes,
      checkIn: datesChanged ? nextCheckIn : undefined,
      checkOut: datesChanged ? nextCheckOut : undefined,
      nights: recalc ? computedNights : undefined,
      adults: guestsChanged ? nextAdults : undefined,
      children: guestsChanged ? nextChildren : undefined,
      nightlyTotal: recalc || typeof body.nightlyTotal === 'number' ? nextNightlyTotal : undefined,
      cleaningFee: recalc || typeof body.cleaningFee === 'number' ? nextCleaningFee : undefined,
      depositFee: recalc || typeof body.depositFee === 'number' ? nextDepositFee : undefined,
      extraCharges: body.extraCharges,
      discountAmount: recalc || typeof body.discountAmount === 'number' ? nextDiscountAmount : undefined,
      totalAmount:
        recalc ||
        typeof body.nightlyTotal === 'number' ||
        typeof body.cleaningFee === 'number' ||
        typeof body.depositFee === 'number' ||
        typeof body.discountAmount === 'number' ||
        body.extraCharges !== undefined
          ? nextTotalAmount
          : undefined,
    },
  });

  if (body.markOfflinePaymentReceived) {
    const reference =
      body.paymentReference?.trim() ||
      `OFFLINE-${randomBytes(6).toString('hex').toUpperCase()}`;

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: 'OFFLINE',
        reference,
        status: 'SUCCESS',
        amount: body.paymentAmount ?? booking.totalAmount,
        currency: booking.currency,
      },
    });
  }

  if (body.status && body.status !== booking.status) {
    if (body.status === 'CONFIRMED') {
      await sendEmail({
        to: booking.guestEmail,
        subject: 'Booking confirmed — OTA Apartments',
        html: `<p>Hi ${booking.guestName},</p>
<p>Your booking <strong>${booking.code}</strong> has been confirmed.</p>
<p>Open your portal: <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/booking/${booking.code}">Booking portal</a></p>`,
      });
    }
    if (body.status === 'CHECKED_OUT') {
      await sendEmail({
        to: booking.guestEmail,
        subject: 'Thanks for staying with us — OTA Apartments',
        html: `<p>Hi ${booking.guestName},</p>
<p>Thanks for staying with OTA Apartments. We’d love your feedback.</p>`,
      });
    }
  }

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'BOOKING_UPDATE',
    entityType: 'Booking',
    entityId: updated.id,
    metadata: { status: body.status, offlinePayment: body.markOfflinePaymentReceived ? true : false },
  });

  return NextResponse.json({ booking: updated });
}
