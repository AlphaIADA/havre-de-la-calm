'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

function normalizeBookingCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function ChatWidget() {
  const pathname = usePathname();
  const hidden = pathname.startsWith('/admin') || pathname.startsWith('/checkin');
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  const [bookingCode, setBookingCode] = React.useState('');
  const [guestName, setGuestName] = React.useState('');
  const [guestEmail, setGuestEmail] = React.useState('');
  const [body, setBody] = React.useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = normalizeBookingCode(bookingCode);
    const message = body.trim();
    if (!message) {
      toast.error('Message is required');
      return;
    }
    if (!code) {
      if (!guestName.trim()) {
        toast.error('Name is required');
        return;
      }
      if (!guestEmail.trim()) {
        toast.error('Email is required');
        return;
      }
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            bookingCode: code || null,
            guestName: guestName.trim() || null,
            guestEmail: guestEmail.trim() || null,
            body: message,
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? 'Send failed');

        toast.success('Message sent', {
          description: code ? `We’ll reply in your booking portal (${code}).` : 'We’ll get back to you shortly.',
        });
        setBody('');
        if (code) {
          // Keep booking code to help the guest follow up.
          setOpen(false);
          window.location.href = `/booking/${code}`;
        } else {
          setOpen(false);
        }
      } catch (err) {
        toast.error('Could not send message', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  if (hidden) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/20 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900/30"
        aria-label="Open chat"
      >
        <MessageCircle className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold">Message OTA Apartments</div>
                <div className="mt-1 text-xs text-zinc-500">
                  If you have a booking, add your code to continue in the guest portal.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Booking code (optional)</label>
                <input
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-zinc-900/15"
                  placeholder="E.g. A1B2C3D4E5F6"
                  disabled={pending}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full name</label>
                  <input
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                    placeholder="Your name"
                    disabled={pending}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                    placeholder="you@email.com"
                    disabled={pending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                  placeholder="How can we help?"
                  disabled={pending}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Sending…' : 'Send'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

