import { Resend } from 'resend';

import { isResendConfigured } from '@/lib/env';

export async function sendEmail(input: { to: string | string[]; subject: string; html: string }) {
  if (!isResendConfigured()) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM!;
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;

  const to = Array.isArray(input.to) ? input.to : [input.to];
  await resend.emails.send({
    from,
    to,
    subject: input.subject,
    html: input.html,
    replyTo,
  });
}

