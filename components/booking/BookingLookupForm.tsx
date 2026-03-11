'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

function normalizeCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function BookingLookupForm(props: { onDone?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [code, setCode] = React.useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeCode(code);
    if (!normalized) {
      toast.error('Enter your booking code');
      return;
    }
    if (!/^[A-Z0-9]{6,40}$/.test(normalized)) {
      toast.error('Invalid booking code', { description: 'Check the code and try again.' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/booking/lookup', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ code: normalized }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? 'Lookup failed');
        router.push(`/booking/${normalized}`);
        router.refresh();
        props.onDone?.();
      } catch (err) {
        toast.error('Booking not found', {
          description: err instanceof Error ? err.message : 'Check the code and try again.',
        });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-2">
        <label className="text-sm font-medium">Booking code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-zinc-900/15"
          placeholder="E.g. A1B2C3D4E5F6"
          disabled={pending}
          required
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? 'Checking…' : 'Open booking'}
      </Button>
      <p className="text-xs text-zinc-500">Your booking code is shown after checkout and in your email.</p>
    </form>
  );
}
