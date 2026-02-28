'use server';

import { randomBytes } from 'crypto';
import { z } from 'zod';

import { getDemoUnitBySlug } from '@/lib/demoData';
import { parseDateOnly } from '@/lib/dateOnly';
import { isDbConfigured } from '@/lib/env';
import { generateUniqueBookingCode } from '@/lib/bookingCode';
import { getPrisma } from '@/lib/prisma';
import { calculatePrice } from '@/lib/pricing';
import { isPaystackEnabled, paystackInitialize } from '@/lib/paystack';
import { sendEmail } from '@/lib/email';

const createBookingSchema = z.object({
  unitSlug: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  guestName: z.string().min(2).max(200),
  guestEmail: z.string().email().max(320),
  guestPhone: z.string().min(5).max(50),
  payMode: z.enum(['PAY_LATER', 'PAY_NOW']),
  promoCode: z.string().max(40).optional().nullable(),
});

const quoteSchema = z.object({
  unitSlug: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  promoCode: z.string().max(40).optional().nullable(),
});

type PromoLite = { id: string; code: string; type: 'PERCENT' | 'FIXED'; amount: number; active: boolean; maxRedemptions: number | null; redeemedCount: number; expiresAt: Date | null; propertyId: string | null; unitId: string | null };

function normalizePromoCode(raw: string | null | undefined) {
  const code = (raw ?? '').trim().toUpperCase();
  return code ? code : null;
}

function computeDiscount(promo: Pick<PromoLite, 'type' | 'amount'>, nightlyTotal: number) {
  if (nightlyTotal <= 0) return 0;
  if (promo.type === 'PERCENT') {
    const percent = promo.amount;
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) return 0;
    return Math.min(nightlyTotal, Math.floor((nightlyTotal * percent) / 100));
  }
  const fixed = promo.amount;
  if (!Number.isFinite(fixed) || fixed <= 0) return 0;
  return Math.min(nightlyTotal, Math.floor(fixed));
}

function validatePromoOrThrow(promo: PromoLite, unit: { id: string; propertyId: string }, now: Date) {
  if (!promo.active) throw new Error('Promo code is inactive.');
  if (promo.expiresAt && promo.expiresAt.getTime() < now.getTime()) throw new Error('Promo code has expired.');
  if (promo.maxRedemptions !== null && promo.redeemedCount >= promo.maxRedemptions) {
    throw new Error('Promo code redemption limit reached.');
  }
  if (promo.unitId && promo.unitId !== unit.id) throw new Error('Promo code does not apply to this unit.');
  if (promo.propertyId && promo.propertyId !== unit.propertyId) {
    throw new Error('Promo code does not apply to this property.');
  }
  if (promo.type === 'PERCENT' && promo.amount > 100) throw new Error('Promo code configuration is invalid.');
}

async function getPromo(prisma: ReturnType<typeof getPrisma>, code: string) {
  const promo = await prisma.promoCode.findUnique({ where: { code } });
  return promo as PromoLite | null;
}

export async function quoteBooking(input: z.infer<typeof quoteSchema>) {
  const data = quoteSchema.parse(input);

  const checkIn = parseDateOnly(data.checkIn);
  const checkOut = parseDateOnly(data.checkOut);
  if (!checkIn || !checkOut) throw new Error('Invalid dates');
  if (checkOut <= checkIn) throw new Error('Check-out must be after check-in');

  const promoCode = normalizePromoCode(data.promoCode);

  if (!isDbConfigured()) {
    const unit = getDemoUnitBySlug(data.unitSlug);
    if (!unit) throw new Error('Unit not found');
    const breakdown = calculatePrice({
      checkIn,
      checkOut,
      baseNightly: unit.baseNightly,
      weekendNightly: unit.weekendNightly,
      cleaningFee: unit.cleaningFee,
      depositFee: unit.depositFee,
    });
    return {
      nights: breakdown.nights,
      nightlyTotal: breakdown.nightlyTotal,
      cleaningFee: breakdown.cleaningFee,
      depositFee: breakdown.depositFee,
      discountAmount: 0,
      total: breakdown.total,
      promoApplied: null,
    };
  }

  const prisma = getPrisma();

  const unit = await prisma.unit.findUnique({
    where: { slug: data.unitSlug },
    include: { property: true },
  });
  if (!unit) throw new Error('Unit not found');

  const guestsTotal = data.adults + data.children;
  if (guestsTotal > unit.maxGuests) {
    throw new Error(`Max guests for this unit is ${unit.maxGuests}`);
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
    throw new Error(`Minimum stay is ${unit.minNights} nights`);
  }

  const blocked = await prisma.availabilityBlock.findFirst({
    where: {
      unitId: unit.id,
      startDate: { lt: checkOut },
      endDate: { gt: checkIn },
    },
  });
  if (blocked) throw new Error('Selected dates are unavailable (maintenance block).');

  const conflict = await prisma.booking.findFirst({
    where: {
      unitId: unit.id,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
  if (conflict) throw new Error('Selected dates are unavailable.');

  const now = new Date();
  let promo: PromoLite | null = null;
  let discountAmount = 0;
  if (promoCode) {
    promo = await getPromo(prisma, promoCode);
    if (!promo) throw new Error('Promo code is invalid.');
    validatePromoOrThrow(promo, { id: unit.id, propertyId: unit.propertyId }, now);
    discountAmount = computeDiscount(promo, breakdown.nightlyTotal);
  }

  return {
    nights: breakdown.nights,
    nightlyTotal: breakdown.nightlyTotal,
    cleaningFee: breakdown.cleaningFee,
    depositFee: breakdown.depositFee,
    discountAmount,
    total: breakdown.nightlyTotal - discountAmount + breakdown.cleaningFee + breakdown.depositFee,
    promoApplied: promo ? { code: promo.code, type: promo.type, amount: promo.amount } : null,
  };
}

export async function createBookingStub(input: z.infer<typeof createBookingSchema>) {
  const data = createBookingSchema.parse(input);

  const checkIn = parseDateOnly(data.checkIn);
  const checkOut = parseDateOnly(data.checkOut);
  if (!checkIn || !checkOut) throw new Error('Invalid dates');
  if (checkOut <= checkIn) throw new Error('Check-out must be after check-in');
  const promoCode = normalizePromoCode(data.promoCode);

  if (!isDbConfigured()) {
    const unit = getDemoUnitBySlug(data.unitSlug);
    if (!unit) throw new Error('Unit not found');

    const breakdown = calculatePrice({
      checkIn,
      checkOut,
      baseNightly: unit.baseNightly,
      weekendNightly: unit.weekendNightly,
      cleaningFee: unit.cleaningFee,
      depositFee: unit.depositFee,
    });

    if (breakdown.nights < unit.minNights) {
      throw new Error(`Minimum stay is ${unit.minNights} nights`);
    }

    const bookingCode = randomBytes(6).toString('hex').toUpperCase();

    return {
      bookingCode,
      amount: breakdown.total,
      currency: 'NGN',
      payMode: data.payMode,
      promoCode,
    };
  }

  const prisma = getPrisma();

  const unit = await prisma.unit.findUnique({
    where: { slug: data.unitSlug },
    include: { property: true },
  });
  if (!unit) throw new Error('Unit not found');

  const guestsTotal = data.adults + data.children;
  if (guestsTotal > unit.maxGuests) {
    throw new Error(`Max guests for this unit is ${unit.maxGuests}`);
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
    throw new Error(`Minimum stay is ${unit.minNights} nights`);
  }

  const blocked = await prisma.availabilityBlock.findFirst({
    where: {
      unitId: unit.id,
      startDate: { lt: checkOut },
      endDate: { gt: checkIn },
    },
  });
  if (blocked) throw new Error('Selected dates are unavailable (maintenance block).');

  const conflict = await prisma.booking.findFirst({
    where: {
      unitId: unit.id,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      checkIn: { lt: checkOut },
      checkOut: { gt: checkIn },
    },
  });
  if (conflict) throw new Error('Selected dates are unavailable.');

  const now = new Date();
  let promo: PromoLite | null = null;
  let discountAmount = 0;
  if (promoCode) {
    promo = await getPromo(prisma, promoCode);
    if (!promo) throw new Error('Promo code is invalid.');
    validatePromoOrThrow(promo, { id: unit.id, propertyId: unit.propertyId }, now);
    discountAmount = computeDiscount(promo, breakdown.nightlyTotal);
  }

  const bookingCode = await generateUniqueBookingCode(prisma);
  const totalAmount = breakdown.nightlyTotal - discountAmount + breakdown.cleaningFee + breakdown.depositFee;

  const booking = await prisma.$transaction(async (tx) => {
    let appliedPromoCodeId: string | undefined;
    if (promo) {
      const updated = await tx.promoCode.updateMany({
        where: {
          id: promo.id,
          active: true,
          ...(promo.maxRedemptions !== null ? { redeemedCount: { lt: promo.maxRedemptions } } : {}),
          OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        },
        data: { redeemedCount: { increment: 1 } },
      });
      if (updated.count !== 1) {
        throw new Error('Promo code is no longer available.');
      }
      appliedPromoCodeId = promo.id;
    }

    return tx.booking.create({
      data: {
        code: bookingCode,
        source: 'ONLINE',
        status: 'PENDING',
        payMode: data.payMode === 'PAY_NOW' ? 'PAY_NOW' : 'PAY_LATER',
        currency: 'NGN',
        propertyId: unit.propertyId,
        unitId: unit.id,
        promoCodeId: appliedPromoCodeId,
        discountAmount,
        checkIn,
        checkOut,
        nights: breakdown.nights,
        adults: data.adults,
        children: data.children,
        nightlyTotal: breakdown.nightlyTotal,
        cleaningFee: breakdown.cleaningFee,
        depositFee: breakdown.depositFee,
        totalAmount,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone,
        kycProfile: {
          create: {
            status: 'PENDING',
            fullName: data.guestName,
            email: data.guestEmail,
            phone: data.guestPhone,
          },
        },
      },
      select: { id: true, code: true, totalAmount: true },
    });
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  const datesText = `${data.checkIn} → ${data.checkOut}`;
  const promoText = promoCode ? `Promo: ${promoCode}` : '';

  await sendEmail({
    to: data.guestEmail,
    subject: 'Booking received — OTA Apartments',
    html: `<p>Hi ${data.guestName},</p>
<p>Your booking request has been received.</p>
<p><strong>Booking code:</strong> ${booking.code}</p>
<p><strong>Stay:</strong> ${unit.property.name} — ${unit.name}</p>
<p><strong>Dates:</strong> ${datesText}</p>
${promoText ? `<p><strong>${promoText}</strong></p>` : ''}
<p>You can manage KYC and messages here: <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/booking/${booking.code}">Open booking portal</a></p>`,
  });

  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: 'New booking received — OTA Apartments',
      html: `<p>New booking received.</p>
<p><strong>Code:</strong> ${booking.code}</p>
<p><strong>Guest:</strong> ${data.guestName} (${data.guestEmail})</p>
<p><strong>Stay:</strong> ${unit.property.name} — ${unit.name}</p>
<p><strong>Dates:</strong> ${datesText}</p>
${promoText ? `<p><strong>${promoText}</strong></p>` : ''}
<p>Open in admin: <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/bookings">Bookings</a></p>`,
    });
  }

  if (data.payMode === 'PAY_NOW') {
    if (!isPaystackEnabled()) {
      throw new Error('Pay Now is disabled (missing Paystack keys).');
    }

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/booking/${booking.code}`;
    const reference = booking.code;

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: 'PAYSTACK',
        reference,
        status: 'INITIATED',
        amount: booking.totalAmount,
        currency: 'NGN',
      },
    });

    const init = await paystackInitialize({
      email: data.guestEmail,
      amountKobo: booking.totalAmount * 100,
      callbackUrl,
      reference,
      metadata: { bookingCode: booking.code },
    });

    return {
      bookingCode: booking.code,
      amount: booking.totalAmount,
      currency: 'NGN',
      payMode: data.payMode,
      paystackUrl: init.authorization_url,
    };
  }

  return {
    bookingCode: booking.code,
    amount: booking.totalAmount,
    currency: 'NGN',
    payMode: data.payMode,
  };
}
