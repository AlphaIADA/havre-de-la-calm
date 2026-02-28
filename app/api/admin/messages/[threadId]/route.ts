import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { sendEmail } from '@/lib/email';

const schema = z.object({
  body: z.string().min(1).max(2000),
  closeThread: z.boolean().optional(),
});

export async function POST(req: Request, context: { params: Promise<{ threadId: string }> }) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  const { threadId } = await context.params;
  const prisma = getPrisma();
  const body = schema.parse(await req.json());

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    select: { id: true, guestEmail: true, guestName: true },
  });
  if (!thread) return NextResponse.json({ error: 'Thread not found' }, { status: 404 });

  await prisma.message.create({
    data: {
      threadId,
      senderRole: 'STAFF',
      senderUserId: session!.userId,
      body: body.body,
    },
  });

  if (body.closeThread) {
    await prisma.messageThread.update({ where: { id: threadId }, data: { status: 'CLOSED' } });
  }

  if (thread.guestEmail) {
    await sendEmail({
      to: thread.guestEmail,
      subject: 'New message — OTA Apartments',
      html: `<p>Hi ${thread.guestName ?? 'there'},</p>
<p>You have a new message from OTA Apartments:</p>
<p>${body.body.replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</p>
<p>Open your booking portal to reply.</p>`,
    });
  }

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'MESSAGE_REPLY',
    entityType: 'MessageThread',
    entityId: threadId,
  });

  return NextResponse.json({ ok: true });
}
