'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

export function GuestMessageForm(props: { bookingCode: string; guestName?: string; guestEmail?: string }) {
  const [pending, startTransition] = React.useTransition();
  const [body, setBody] = React.useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/booking/${props.bookingCode}/messages`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            body,
            guestName: props.guestName,
            guestEmail: props.guestEmail,
          }),
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json?.error ?? 'Send failed');
        }
        setBody('');
        toast.success('Message sent');
      } catch (err) {
        toast.error('Could not send message', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        className="w-full rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
        placeholder="Write a message about your booking…"
      />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Sending…' : 'Send message'}
      </Button>
      <p className="text-xs text-zinc-500">
        Email notifications will be enabled when RESEND_API_KEY is configured.
      </p>
    </form>
  );
}

