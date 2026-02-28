'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

type UnitOption = { id: string; name: string; propertyName: string };
type BlockRow = {
  id: string;
  unitName: string;
  propertyName: string;
  startDate: string;
  endDate: string;
  reason: string | null;
};

export function AvailabilityManager({ units, blocks }: { units: UnitOption[]; blocks: BlockRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [unitId, setUnitId] = React.useState(units[0]?.id ?? '');
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [reason, setReason] = React.useState('');

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/availability', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            unitId,
            startDate,
            endDate,
            reason: reason || null,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Create failed');
        toast.success('Block created');
        setStartDate('');
        setEndDate('');
        setReason('');
        router.refresh();
      } catch (err) {
        toast.error('Could not create block', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const remove = (blockId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/availability/${blockId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        toast.success('Block removed');
        router.refresh();
      } catch (err) {
        toast.error('Could not remove block', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold">Availability blocking</h2>
        <p className="mt-1 text-sm text-zinc-600">Block dates for maintenance or internal holds.</p>
      </div>

      <form onSubmit={create} className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="text-sm font-semibold">Create block</div>
        <select
          value={unitId}
          onChange={(e) => setUnitId(e.target.value)}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          required
        >
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.propertyName} — {u.name}
            </option>
          ))}
        </select>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (optional)"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create block'}
        </Button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((b) => (
              <tr key={b.id} className="border-t border-zinc-200">
                <td className="px-4 py-3">
                  <div className="font-medium">{b.unitName}</div>
                  <div className="text-xs text-zinc-500">{b.propertyName}</div>
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {b.startDate} → {b.endDate}
                </td>
                <td className="px-4 py-3 text-zinc-700">{b.reason ?? '—'}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => remove(b.id)}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                    disabled={pending}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
            {!blocks.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-600" colSpan={4}>
                  No blocks yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

