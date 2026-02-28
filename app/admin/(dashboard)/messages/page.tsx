import Link from 'next/link';

import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Messages' };
export const dynamic = 'force-dynamic';

export default async function AdminMessagesInboxPage() {
  const prisma = getPrisma();
  const threads = await prisma.messageThread.findMany({
    include: {
      booking: { select: { code: true } },
      _count: { select: { messages: true } },
      messages: { take: 1, orderBy: { createdAt: 'desc' }, select: { body: true, createdAt: true, senderRole: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Messaging inbox</h2>
        <p className="mt-1 text-sm text-zinc-600">Threads from guest portals and inquiries.</p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Thread</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Messages</th>
              <th className="px-4 py-3">Last</th>
              <th className="px-4 py-3 text-right">Open</th>
            </tr>
          </thead>
          <tbody>
            {threads.map((t) => (
              <tr key={t.id} className="border-t border-zinc-200">
                <td className="px-4 py-3">
                  <div className="font-medium">{t.subject ?? 'Thread'}</div>
                  <div className="text-xs text-zinc-500">{t.status}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{t.guestName ?? '—'}</div>
                  <div className="text-xs text-zinc-500">{t.guestEmail ?? '—'}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{t.booking?.code ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-700">{t._count.messages}</td>
                <td className="px-4 py-3 text-xs text-zinc-600">
                  {t.messages[0]?.senderRole ? `${t.messages[0].senderRole}: ` : ''}
                  {t.messages[0]?.body?.slice(0, 80) ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/messages/${t.id}`}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                  >
                    Open
                  </Link>
                </td>
              </tr>
            ))}
            {!threads.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-600" colSpan={6}>
                  No threads yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

