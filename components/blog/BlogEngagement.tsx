'use client';

import * as React from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

const EMOJIS = ['👍', '❤️', '🎉', '😄', '😮'] as const;

type CommentRow = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
};

type ReactionRow = {
  emoji: string;
  count: number;
};

function storageKey(slug: string, emoji: string) {
  return `ota_blog_reacted:${slug}:${emoji}`;
}

export function BlogEngagement(props: {
  slug: string;
  initialComments: CommentRow[];
  initialReactions: ReactionRow[];
}) {
  const [reactionCounts, setReactionCounts] = React.useState<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const e of EMOJIS) counts[e] = 0;
    for (const r of props.initialReactions) counts[r.emoji] = r.count;
    return counts;
  });

  const [reactPending, startReactTransition] = React.useTransition();
  const [commentPending, startCommentTransition] = React.useTransition();

  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [body, setBody] = React.useState('');

  const react = (emoji: string) => {
    if (typeof window !== 'undefined') {
      const key = storageKey(props.slug, emoji);
      if (window.localStorage.getItem(key)) {
        toast.message('Reaction saved', { description: 'You already reacted to this post.' });
        return;
      }
    }

    startReactTransition(async () => {
      try {
        const res = await fetch(`/api/blog/${props.slug}/reactions`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? 'Could not react');

        const next = json?.reactions as ReactionRow[] | undefined;
        if (next?.length) {
          const counts: Record<string, number> = {};
          for (const e of EMOJIS) counts[e] = 0;
          for (const r of next) counts[r.emoji] = r.count;
          setReactionCounts(counts);
        } else {
          setReactionCounts((current) => ({ ...current, [emoji]: (current[emoji] ?? 0) + 1 }));
        }

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(storageKey(props.slug, emoji), '1');
        }

        toast.success('Thanks for reacting!');
      } catch (err) {
        toast.error('Could not save reaction', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (!body.trim()) {
      toast.error('Comment is required');
      return;
    }

    startCommentTransition(async () => {
      try {
        const res = await fetch(`/api/blog/${props.slug}/comments`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            email: email.trim() || null,
            body: body.trim(),
          }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error ?? 'Could not submit comment');
        toast.success('Comment submitted', { description: 'It will appear after approval.' });
        setBody('');
      } catch (err) {
        toast.error('Could not submit comment', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="mt-10 space-y-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold">Reactions</h2>
        <p className="mt-1 text-sm text-zinc-600">Let us know what you think.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => react(emoji)}
              disabled={reactPending}
              className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-60"
            >
              <span className="text-base">{emoji}</span>
              <span className="text-xs text-zinc-600">{reactionCounts[emoji] ?? 0}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
        <h2 className="text-base font-semibold">Comments</h2>
        <p className="mt-1 text-sm text-zinc-600">Join the conversation.</p>

        <form onSubmit={submitComment} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                placeholder="Your name"
                disabled={commentPending}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                placeholder="you@email.com"
                disabled={commentPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Comment</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              placeholder="Write your comment…"
              disabled={commentPending}
              required
            />
          </div>
          <Button type="submit" disabled={commentPending}>
            {commentPending ? 'Submitting…' : 'Submit comment'}
          </Button>
          <p className="text-xs text-zinc-500">Comments are moderated for safety.</p>
        </form>

        <div className="mt-8 space-y-4">
          {props.initialComments.length ? (
            props.initialComments.map((c) => (
              <div key={c.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.createdAt.slice(0, 10)}</div>
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">{c.body}</div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
              No comments yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

