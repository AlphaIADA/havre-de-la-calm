import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';
import { verifyPaystackWebhookSignature } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const signature = req.headers.get('x-paystack-signature') ?? '';
  const rawBody = await req.text();

  if (!verifyPaystackWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (!parsed || typeof parsed !== 'object') {
    return NextResponse.json({ ok: true });
  }

  const event = parsed as { event?: unknown; data?: { reference?: unknown } };
  const reference = typeof event.data?.reference === 'string' ? event.data.reference : undefined;
  const eventType = typeof event.event === 'string' ? event.event : undefined;

  if (!reference || !eventType) {
    return NextResponse.json({ ok: true });
  }

  const prisma = getPrisma();
  const payment = await prisma.payment.findUnique({ where: { reference } });
  const raw = parsed as Prisma.InputJsonValue;

  if (!payment) {
    return NextResponse.json({ ok: true });
  }

  if (eventType === 'charge.success') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'SUCCESS', raw },
    });

    const booking = await prisma.booking.findUnique({
      where: { id: payment.bookingId },
      include: { kycProfile: true },
    });

    if (booking && booking.kycProfile?.status === 'APPROVED' && booking.status === 'PENDING') {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'CONFIRMED' },
      });
    }
  } else if (eventType === 'charge.failed') {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', raw },
    });
  } else {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { raw },
    });
  }

  return NextResponse.json({ ok: true });
}
