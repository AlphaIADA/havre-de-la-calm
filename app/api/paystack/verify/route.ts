import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';
import { getPaystackSecret } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const reference = url.searchParams.get('reference') ?? '';

  const secret = getPaystackSecret();
  if (!secret) return NextResponse.json({ error: 'Paystack not configured' }, { status: 503 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  if (!reference) return NextResponse.json({ error: 'Missing reference' }, { status: 400 });

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    method: 'GET',
  });
  const json: unknown = await res.json().catch(() => null);
  if (!res.ok || !json || typeof json !== 'object') {
    return NextResponse.json({ error: 'Verify failed' }, { status: 502 });
  }

  const paystackData = (json as { data?: { status?: string } }).data;
  const paystackStatus = paystackData?.status ?? null;

  const prisma = getPrisma();
  const payment = await prisma.payment.findUnique({ where: { reference } });
  const raw = json as Prisma.InputJsonValue;
  if (payment && paystackStatus === 'success') {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'SUCCESS', raw } });
  } else if (payment && paystackStatus === 'failed') {
    await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', raw } });
  } else if (payment) {
    await prisma.payment.update({ where: { id: payment.id }, data: { raw } });
  }

  return NextResponse.json({ ok: true, paystack: json });
}
