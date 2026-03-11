'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

type CommentRow = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  name: string;
  email: string | null;
  body: string;
  createdAt: string;
  post: { slug: string; title: string };
};

export function BlogCommentsManager({ comments }: { comments: CommentRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<'ALL' | CommentRow['status']>('ALL');

  const filtered = comments.filter((c) => {
    if (status !== 'ALL' && c.status !== status) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      c.post.title.toLowerCase().includes(q) ||
      c.post.slug.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q)
    );
  });

  const updateStatus = (id: string, next: CommentRow['status']) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/blog/comments/${id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Update failed');
        toast.success('Comment updated');
        router.refresh();
      } catch (err) {
        toast.error('Could not update comment', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const remove = (id: string) => {
    const ok = window.confirm('Delete this comment?');
    if (!ok) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/blog/comments/${id}`, { method: 'DELETE' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Delete failed');
        toast.success('Comment deleted');
        router.refresh();
      } catch (err) {
        toast.error('Could not delete comment', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Blog comments</h2>
        <p className="mt-1 text-sm text-zinc-600">Approve, hide, or delete visitor comments.</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, post, or text…"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value === 'ALL' ? 'ALL' : (e.target.value as CommentRow['status']))}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="HIDDEN">Hidden</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.map((c) => (
          <div key={c.id} className="rounded-3xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  {c.name}{' '}
                  <span className="ml-2 rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-900">
                    {c.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {c.email ?? '—'} • {c.createdAt.slice(0, 10)}
                </div>
                <div className="text-xs text-zinc-500">
                  Post:{' '}
                  <Link href={`/blog/${c.post.slug}`} target="_blank" className="font-medium text-zinc-900 hover:underline">
                    {c.post.title}
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 px-3 py-1 text-xs"
                  onClick={() => updateStatus(c.id, 'APPROVED')}
                  disabled={pending}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 px-3 py-1 text-xs"
                  onClick={() => updateStatus(c.id, 'HIDDEN')}
                  disabled={pending}
                >
                  Hide
                </Button>
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                  disabled={pending}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="mt-4 whitespace-pre-wrap text-sm text-zinc-700">{c.body}</div>
          </div>
        ))}

        {!filtered.length ? (
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700">
            No comments found.
          </div>
        ) : null}
      </div>
    </div>
  );
}

