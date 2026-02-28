'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

type Property = { id: string; name: string };
type Unit = {
  id: string;
  slug: string;
  name: string;
  propertyId: string;
  property: { name: string };
  maxGuests: number;
  minNights: number;
  baseNightly: number;
  weekendNightly: number | null;
  cleaningFee: number;
  depositFee: number;
  active: boolean;
};

export function UnitsManager({ units, properties }: { units: Unit[]; properties: Property[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [propertyId, setPropertyId] = React.useState(properties[0]?.id ?? '');
  const [slug, setSlug] = React.useState('');
  const [name, setName] = React.useState('');
  const [maxGuests, setMaxGuests] = React.useState(2);
  const [minNights, setMinNights] = React.useState(1);
  const [baseNightly, setBaseNightly] = React.useState(25000);
  const [weekendNightly, setWeekendNightly] = React.useState<number | ''>('');
  const [cleaningFee, setCleaningFee] = React.useState(0);
  const [depositFee, setDepositFee] = React.useState(0);

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/units', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            propertyId,
            slug,
            name,
            maxGuests,
            minNights,
            baseNightly,
            weekendNightly: weekendNightly === '' ? null : weekendNightly,
            cleaningFee,
            depositFee,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Create failed');
        }
        toast.success('Unit created');
        setSlug('');
        setName('');
        router.refresh();
      } catch (err) {
        toast.error('Could not create unit', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const onToggleActive = (u: Unit) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/units/${u.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ active: !u.active }),
        });
        if (!res.ok) throw new Error('Update failed');
        toast.success(u.active ? 'Unit deactivated' : 'Unit activated');
        router.refresh();
      } catch (err) {
        toast.error('Could not update unit', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold">Units</h2>
        <p className="mt-1 text-sm text-zinc-600">Pricing, fees, capacity, and availability live here.</p>
      </div>

      <form onSubmit={onCreate} className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="text-sm font-semibold">Create unit</div>
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          >
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (e.g. havre-suite)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Unit name"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
            required
          />
          <div className="grid gap-3 md:grid-cols-2 md:col-span-2">
            <input
              type="number"
              min={1}
              value={maxGuests}
              onChange={(e) => setMaxGuests(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Max guests"
              required
            />
            <input
              type="number"
              min={1}
              value={minNights}
              onChange={(e) => setMinNights(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Min nights"
              required
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2 md:col-span-2">
            <input
              type="number"
              min={0}
              value={baseNightly}
              onChange={(e) => setBaseNightly(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Base nightly (NGN)"
              required
            />
            <input
              type="number"
              min={0}
              value={weekendNightly}
              onChange={(e) =>
                setWeekendNightly(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Weekend nightly (optional)"
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2 md:col-span-2">
            <input
              type="number"
              min={0}
              value={cleaningFee}
              onChange={(e) => setCleaningFee(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Cleaning fee"
            />
            <input
              type="number"
              min={0}
              value={depositFee}
              onChange={(e) => setDepositFee(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Refundable deposit"
            />
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create unit'}
        </Button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Unit</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Pricing</th>
              <th className="px-4 py-3">Guests</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-t border-zinc-200">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-zinc-500">{u.slug}</div>
                </td>
                <td className="px-4 py-3 text-zinc-700">{u.property.name}</td>
                <td className="px-4 py-3 text-zinc-700">
                  ₦{u.baseNightly.toLocaleString()}
                  {u.weekendNightly ? (
                    <span className="text-xs text-zinc-500">
                      {' '}
                      (wknd ₦{u.weekendNightly.toLocaleString()})
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  Max {u.maxGuests} • Min {u.minNights} nights
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ring-1 ${
                      u.active
                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        : 'bg-zinc-50 text-zinc-600 ring-zinc-200'
                    }`}
                  >
                    {u.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/units/${u.id}`}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onToggleActive(u)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                      disabled={pending}
                    >
                      {u.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!units.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-600" colSpan={6}>
                  No units yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
