import { NextResponse } from 'next/server';
import { Resend } from 'resend';

import { requireStaffApi } from '@/lib/auth/api';
import { getPrisma } from '@/lib/prisma';
import { isResendConfigured } from '@/lib/env';
import { writeAuditLog } from '@/lib/audit';

function uniqueEmails(values: (string | null)[]) {
  const set = new Set<string>();
  for (const v of values) {
    const email = (v ?? '').trim().toLowerCase();
    if (email && email.includes('@')) set.add(email);
  }
  return [...set].sort();
}

function getSegmentType(criteria: unknown): 'ALL_GUESTS' | 'PAST_GUESTS' {
  if (!criteria || typeof criteria !== 'object') return 'ALL_GUESTS';
  const type = (criteria as Record<string, unknown>).type;
  return type === 'PAST_GUESTS' ? 'PAST_GUESTS' : 'ALL_GUESTS';
}

export async function POST(
  req: Request,
  context: { params: Promise<{ campaignId: string }> },
) {
  const { session, response } = await requireStaffApi();
  if (response) return response;

  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'Resend not configured' }, { status: 503 });
  }

  const { campaignId } = await context.params;
  const prisma = getPrisma();

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: { segment: true },
  });
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

  const segmentType = getSegmentType(campaign.segment?.criteria);

  const guestEmails = await prisma.booking.findMany({
    where:
      segmentType === 'PAST_GUESTS'
        ? { status: 'CHECKED_OUT' }
        : undefined,
    select: { guestEmail: true },
    take: 5000,
  });
  const recipients = uniqueEmails(guestEmails.map((x) => x.guestEmail));
  const total = recipients.length;

  if (campaign.status === 'SENT') {
    return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const alreadySent = campaign.sentCount ?? 0;
  const batchSize = 50;
  const batch = recipients.slice(alreadySent, alreadySent + batchSize);
  const now = new Date();

  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      status: batch.length ? 'SENDING' : 'SENT',
      sendStartedAt: campaign.sendStartedAt ?? now,
      recipientTotal: total,
      sentAt: !batch.length ? now : null,
    },
  });

  const from = process.env.EMAIL_FROM!;
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;

  let sentThisBatch = 0;
  let failure: unknown = null;

  for (const to of batch) {
    try {
      await resend.emails.send({
        from,
        to: [to],
        subject: campaign.subject,
        html: campaign.html,
        replyTo,
      });
      sentThisBatch += 1;
    } catch (err) {
      failure = err;
      break;
    }
  }

  const newSentCount = Math.min(total, alreadySent + sentThisBatch);
  const done = newSentCount >= total;

  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      sentCount: newSentCount,
      status: failure ? 'FAILED' : done ? 'SENT' : 'SENDING',
      sentAt: done ? new Date() : null,
    },
  });

  await writeAuditLog(prisma, {
    actorId: session!.userId,
    action: 'EMAIL_CAMPAIGN_SEND',
    entityType: 'EmailCampaign',
    entityId: campaign.id,
    metadata: { attempted: sentThisBatch, total, sentCount: newSentCount, done },
  });

  if (failure) {
    return NextResponse.json({ error: 'Send failed', attempted: sentThisBatch, total, sentCount: newSentCount }, { status: 502 });
  }

  return NextResponse.json({ ok: true, attempted: sentThisBatch, total, sentCount: newSentCount, done });
}
