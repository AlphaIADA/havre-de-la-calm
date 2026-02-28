'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

export function ThreadReplyForm({ threadId, canClose }: { threadId: string; canClose: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [body, setBody] = React.useState('');
  const [closeThread, setCloseThread] = React.useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/messages/${threadId}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ body, closeThread: canClose ? closeThread : false }),
        });
        if (!res.ok) {
          const bodyJson = await res.json().catch(() => ({}));
          throw new Error(bodyJson?.error ?? 'Send failed');
        }
        toast.success('Reply sent');
        setBody('');
        router.refresh();
      } catch (err) {
        toast.error('Could not send reply', {
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
        placeholder="Write a reply…"
      />
      {canClose ? (
        <label className="flex items-center gap-2 text-xs text-zinc-600">
          <input type="checkbox" checked={closeThread} onChange={(e) => setCloseThread(e.target.checked)} />
          Close thread after sending
        </label>
      ) : null}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Sending…' : 'Send reply'}
      </Button>
    </form>
  );
}

