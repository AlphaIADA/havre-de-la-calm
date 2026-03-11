import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  body: z.string().min(1).max(2000),
  bookingCode: z.string().max(40).optional().nullable(),
  guestName: z.string().min(2).max(200).optional().nullable(),
  guestEmail: z.string().email().max(320).optional().nullable(),
});

export async function POST(req: Request) {
  if (!isDbConfigured()) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  const data = schema.parse(await req.json());
  const prisma = getPrisma();

  const bodyText = data.body.trim();
  if (!bodyText) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const bookingCode = (data.bookingCode ?? '').trim().toUpperCase();
  if (bookingCode) {
    const booking = await prisma.booking.findUnique({
      where: { code: bookingCode },
      select: {
        id: true,
        code: true,
        guestName: true,
        guestEmail: true,
        unit: { select: { name: true, property: { select: { name: true } } } },
      },
    });
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const thread =
      (await prisma.messageThread.findFirst({
        where: { bookingId: booking.id, status: 'OPEN' },
        orderBy: { createdAt: 'desc' },
      })) ??
      (await prisma.messageThread.create({
        data: {
          bookingId: booking.id,
          status: 'OPEN',
          subject: 'Booking message',
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
        },
      }));

    const message = await prisma.message.create({
      data: { threadId: thread.id, senderRole: 'GUEST', body: bodyText },
      select: { id: true },
    });

    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      await sendEmail({
        to: adminEmail,
        subject: `New message — Booking ${booking.code}`,
        html: `<p>New guest message for booking <strong>${booking.code}</strong>.</p>
<p><strong>Stay:</strong> ${booking.unit.property.name} — ${booking.unit.name}</p>
<p>${bodyText.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>
<p>Open thread: <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/messages">Admin inbox</a></p>`,
      });
    }

    return NextResponse.json({ threadId: thread.id, messageId: message.id, bookingCode: booking.code }, { status: 201 });
  }

  const guestName = (data.guestName ?? '').trim();
  const guestEmail = (data.guestEmail ?? '').trim();
  if (!guestName || !guestEmail) {
    return NextResponse.json({ error: 'Name and email are required (or provide a booking code)' }, { status: 400 });
  }

  const thread = await prisma.messageThread.create({
    data: {
      status: 'OPEN',
      subject: 'Website chat',
      guestName,
      guestEmail,
      messages: {
        create: { senderRole: 'GUEST', body: bodyText },
      },
    },
    select: { id: true },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: 'New website message — OTA Apartments',
      html: `<p>New website message.</p>
<p><strong>Guest:</strong> ${guestName} (${guestEmail})</p>
<p>${bodyText.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>
<p>Open inbox: <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/messages">Admin inbox</a></p>`,
    });
  }

  return NextResponse.json({ threadId: thread.id }, { status: 201 });
}

