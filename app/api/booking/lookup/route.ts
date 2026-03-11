import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';

const schema = z.object({
  code: z.string().min(6).max(40),
});

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const data = schema.parse(await req.json());
  const code = data.code.trim().toUpperCase();

  const prisma = getPrisma();
  const booking = await prisma.booking.findUnique({ where: { code }, select: { id: true, code: true } });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  return NextResponse.json({ ok: true, code: booking.code });
}

