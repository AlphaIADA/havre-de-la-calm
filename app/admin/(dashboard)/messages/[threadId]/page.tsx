import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ThreadReplyForm } from '@/components/admin/ThreadReplyForm';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Thread' };
export const dynamic = 'force-dynamic';

export default async function AdminMessageThreadPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  const prisma = getPrisma();
  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: {
      booking: { select: { code: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });

  if (!thread) return notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-500">{thread.status}</div>
          <h2 className="text-base font-semibold">{thread.subject ?? 'Thread'}</h2>
          <div className="mt-1 text-sm text-zinc-600">
            {thread.guestName ?? 'Guest'} • {thread.guestEmail ?? '—'}
          </div>
          {thread.booking?.code ? (
            <div className="mt-1 text-xs text-zinc-500">
              Booking code: <span className="font-mono">{thread.booking.code}</span>
            </div>
          ) : null}
        </div>
        <Link
          href="/admin/messages"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
        >
          Back
        </Link>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="space-y-3">
          {thread.messages.map((m) => (
            <div key={m.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                <span className="font-semibold">{m.senderRole}</span>
                <span>{m.createdAt.toISOString()}</span>
              </div>
              <div className="mt-2 text-sm text-zinc-800 whitespace-pre-wrap">{m.body}</div>
            </div>
          ))}
          {!thread.messages.length ? (
            <div className="text-sm text-zinc-600">No messages yet.</div>
          ) : null}
        </div>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-white p-5">
        <div className="text-sm font-semibold">Reply</div>
        <div className="mt-3">
          <ThreadReplyForm threadId={thread.id} canClose={thread.status === 'OPEN'} />
        </div>
      </div>
    </div>
  );
}

