'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

export function UnitInquiryForm({ unitSlug }: { unitSlug: string }) {
  const [pending, startTransition] = React.useTransition();
  const [guestName, setGuestName] = React.useState('');
  const [guestEmail, setGuestEmail] = React.useState('');
  const [body, setBody] = React.useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch('/api/inquiry', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ unitSlug, guestName, guestEmail, body }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? 'Send failed');
        toast.success('Inquiry sent', { description: 'We’ll get back to you shortly.' });
        setBody('');
      } catch (err) {
        toast.error('Could not send inquiry', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="text-sm font-semibold">Ask a question</div>
      <input
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        required
      />
      <input
        value={guestEmail}
        onChange={(e) => setGuestEmail(e.target.value)}
        placeholder="Email"
        type="email"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        required
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message"
        rows={3}
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        required
      />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Sending…' : 'Send inquiry'}
      </Button>
    </form>
  );
}

