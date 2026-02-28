'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

export type Promo = {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  amount: number;
  active: boolean;
  redeemedCount: number;
  maxRedemptions: number | null;
  expiresAt: string | null;
  propertyName: string | null;
  unitName: string | null;
};

type PropertyOption = { id: string; name: string };
type UnitOption = { id: string; name: string; propertyId: string; propertyName: string };

export function PromoCodesManager({
  promoCodes,
  properties,
  units,
}: {
  promoCodes: Promo[];
  properties: PropertyOption[];
  units: UnitOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [code, setCode] = React.useState('');
  const [type, setType] = React.useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [amount, setAmount] = React.useState(10);
  const [expiresAt, setExpiresAt] = React.useState('');
  const [maxRedemptions, setMaxRedemptions] = React.useState<number | ''>('');
  const [scopeType, setScopeType] = React.useState<'GLOBAL' | 'PROPERTY' | 'UNIT'>('GLOBAL');
  const [propertyId, setPropertyId] = React.useState(properties[0]?.id ?? '');
  const [unitId, setUnitId] = React.useState(units[0]?.id ?? '');

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const selectedUnit = units.find((u) => u.id === unitId);
        const res = await fetch('/api/admin/promocodes', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            code,
            type,
            amount,
            expiresAt: expiresAt || null,
            maxRedemptions: maxRedemptions === '' ? null : maxRedemptions,
            propertyId:
              scopeType === 'PROPERTY'
                ? propertyId || null
                : scopeType === 'UNIT'
                  ? selectedUnit?.propertyId ?? null
                  : null,
            unitId: scopeType === 'UNIT' ? unitId || null : null,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Create failed');
        }
        toast.success('Promo code created');
        setCode('');
        setAmount(10);
        setExpiresAt('');
        setMaxRedemptions('');
        setScopeType('GLOBAL');
        router.refresh();
      } catch (err) {
        toast.error('Could not create promo code', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const toggle = (p: Promo) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/promocodes/${p.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ active: !p.active }),
        });
        if (!res.ok) throw new Error('Update failed');
        toast.success('Promo code updated');
        router.refresh();
      } catch (err) {
        toast.error('Could not update promo code', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold">Discounts / promo codes</h2>
        <p className="mt-1 text-sm text-zinc-600">Create percent or fixed discounts.</p>
      </div>

      <form onSubmit={onCreate} className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="text-sm font-semibold">Create promo code</div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="CODE (e.g. OTA10)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value === 'FIXED' ? 'FIXED' : 'PERCENT')}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed</option>
          </select>
          <input
            type="number"
            min={1}
            max={type === 'PERCENT' ? 100 : undefined}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            placeholder={type === 'PERCENT' ? 'Percent (e.g. 10)' : 'Amount (NGN)'}
            required
          />
          <input
            type="number"
            min={1}
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value === '' ? '' : Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            placeholder="Max redemptions (optional)"
          />
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            placeholder="Expiry (optional)"
          />
          <select
            value={scopeType}
            onChange={(e) =>
              setScopeType(
                e.target.value === 'PROPERTY' ? 'PROPERTY' : e.target.value === 'UNIT' ? 'UNIT' : 'GLOBAL',
              )
            }
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="GLOBAL">All properties</option>
            <option value="PROPERTY">Specific property</option>
            <option value="UNIT">Specific unit</option>
          </select>
          {scopeType === 'PROPERTY' ? (
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : null}
          {scopeType === 'UNIT' ? (
            <select
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.propertyName} — {u.name}
                </option>
              ))}
            </select>
          ) : null}
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create'}
        </Button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Redemptions</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {promoCodes.map((p) => (
              <tr key={p.id} className="border-t border-zinc-200">
                <td className="px-4 py-3 font-mono text-xs">{p.code}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {p.unitName ? `Unit: ${p.unitName}` : p.propertyName ? `Property: ${p.propertyName}` : 'Global'}
                </td>
                <td className="px-4 py-3">{p.type}</td>
                <td className="px-4 py-3">
                  {p.type === 'PERCENT' ? `${p.amount}%` : `₦${p.amount.toLocaleString()}`}
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  {p.redeemedCount}
                  {p.maxRedemptions ? ` / ${p.maxRedemptions}` : ''}
                </td>
                <td className="px-4 py-3 text-zinc-700">{p.expiresAt ? p.expiresAt.slice(0, 10) : '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ring-1 ${
                      p.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-zinc-50 text-zinc-600 ring-zinc-200'
                    }`}
                  >
                    {p.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => toggle(p)}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                    disabled={pending}
                  >
                    {p.active ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
            {!promoCodes.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-600" colSpan={8}>
                  No promo codes yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
