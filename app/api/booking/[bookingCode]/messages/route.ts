import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const messageSchema = z.object({
  body: z.string().min(1).max(2000),
  guestName: z.string().min(2).max(200).optional(),
  guestEmail: z.string().email().max(320).optional(),
});

export async function POST(
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
    select: { id: true, guestName: true, guestEmail: true },
  });
  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  const data = messageSchema.parse(await req.json());

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
        guestName: data.guestName ?? booking.guestName,
        guestEmail: data.guestEmail ?? booking.guestEmail,
      },
    }));

  const message = await prisma.message.create({
    data: {
      threadId: thread.id,
      senderRole: 'GUEST',
      body: data.body,
    },
    select: { id: true, createdAt: true },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `New message — Booking ${bookingCode}`,
      html: `<p>New guest message for booking <strong>${bookingCode}</strong>.</p>
<p>${data.body.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>
<p>Open thread: <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/messages">Admin inbox</a></p>`,
    });
  }

  return NextResponse.json({ messageId: message.id });
}
