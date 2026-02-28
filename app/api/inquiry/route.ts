import { NextResponse } from 'next/server';
import { z } from 'zod';

import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  unitSlug: z.string().min(1),
  guestName: z.string().min(2).max(200),
  guestEmail: z.string().email().max(320),
  body: z.string().min(1).max(2000),
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

  const thread = await prisma.messageThread.create({
    data: {
      status: 'OPEN',
      subject: `Inquiry: ${unit.name}`,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      unitId: unit.id,
      propertyId: unit.propertyId,
      messages: {
        create: {
          senderRole: 'GUEST',
          body: data.body,
        },
      },
    },
    select: { id: true },
  });

  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    await sendEmail({
      to: adminEmail,
      subject: `New inquiry — ${unit.name}`,
      html: `<p>New unit inquiry.</p>
<p><strong>Unit:</strong> ${unit.property.name} — ${unit.name}</p>
<p><strong>Guest:</strong> ${data.guestName} (${data.guestEmail})</p>
<p>${data.body.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>
<p>Open inbox: <a href="${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/messages">Admin inbox</a></p>`,
    });
  }

  return NextResponse.json({ threadId: thread.id }, { status: 201 });
}

