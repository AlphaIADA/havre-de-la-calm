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
  propertyId: string | null;
  unitId: string | null;
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

  const [editOpen, setEditOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editCode, setEditCode] = React.useState('');
  const [editType, setEditType] = React.useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [editAmount, setEditAmount] = React.useState(10);
  const [editExpiresAt, setEditExpiresAt] = React.useState('');
  const [editMaxRedemptions, setEditMaxRedemptions] = React.useState<number | ''>('');
  const [editScopeType, setEditScopeType] = React.useState<'GLOBAL' | 'PROPERTY' | 'UNIT'>('GLOBAL');
  const [editPropertyId, setEditPropertyId] = React.useState(properties[0]?.id ?? '');
  const [editUnitId, setEditUnitId] = React.useState(units[0]?.id ?? '');

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

  const openEdit = (p: Promo) => {
    setEditingId(p.id);
    setEditCode(p.code);
    setEditType(p.type);
    setEditAmount(p.amount);
    setEditExpiresAt(p.expiresAt ? p.expiresAt.slice(0, 10) : '');
    setEditMaxRedemptions(p.maxRedemptions ?? '');
    setEditScopeType(p.unitId ? 'UNIT' : p.propertyId ? 'PROPERTY' : 'GLOBAL');
    setEditPropertyId(p.propertyId ?? properties[0]?.id ?? '');
    setEditUnitId(p.unitId ?? units[0]?.id ?? '');
    setEditOpen(true);
  };

  const onSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    startTransition(async () => {
      try {
        const selectedUnit = units.find((u) => u.id === editUnitId);
        const res = await fetch(`/api/admin/promocodes/${editingId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            code: editCode,
            type: editType,
            amount: editAmount,
            expiresAt: editExpiresAt || null,
            maxRedemptions: editMaxRedemptions === '' ? null : editMaxRedemptions,
            propertyId:
              editScopeType === 'PROPERTY'
                ? editPropertyId || null
                : editScopeType === 'UNIT'
                  ? selectedUnit?.propertyId ?? null
                  : null,
            unitId: editScopeType === 'UNIT' ? editUnitId || null : null,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Update failed');
        toast.success('Promo code updated');
        setEditOpen(false);
        router.refresh();
      } catch (err) {
        toast.error('Could not update promo code', {
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

  const remove = (p: Promo) => {
    const ok = window.confirm(`Delete promo code ${p.code}? This cannot be undone.`);
    if (!ok) return;
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/promocodes/${p.id}`, { method: 'DELETE' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Delete failed');
        toast.success('Promo code deleted');
        router.refresh();
      } catch (err) {
        toast.error('Could not delete promo code', {
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

      <form onSubmit={onCreate} className="grid gap-4 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="text-sm font-semibold">Create promo code</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="OTA10"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value === 'FIXED' ? 'FIXED' : 'PERCENT')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed amount</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{type === 'PERCENT' ? 'Percent' : 'Amount (NGN)'}</label>
            <input
              type="number"
              min={1}
              max={type === 'PERCENT' ? 100 : undefined}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Usage limit (optional)</label>
            <input
              type="number"
              min={1}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="e.g. 100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Expiry date (optional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Scope</label>
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
          </div>
          {scopeType === 'PROPERTY' ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Property</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {scopeType === 'UNIT' ? (
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Unit</label>
              <select
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.propertyName} — {u.name}
                  </option>
                ))}
              </select>
            </div>
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
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="ml-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                    disabled={pending}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p)}
                    className="ml-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                    disabled={pending}
                  >
                    Delete
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

      {editOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold">Edit promo code</div>
                <div className="mt-1 text-xs text-zinc-500">Update details, limits, and scope.</div>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
              >
                Close
              </button>
            </div>

            <form onSubmit={onSaveEdit} className="mt-4 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Code</label>
                  <input
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value === 'FIXED' ? 'FIXED' : 'PERCENT')}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="PERCENT">Percent</option>
                    <option value="FIXED">Fixed amount</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{editType === 'PERCENT' ? 'Percent' : 'Amount (NGN)'}</label>
                  <input
                    type="number"
                    min={1}
                    max={editType === 'PERCENT' ? 100 : undefined}
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Usage limit (optional)</label>
                  <input
                    type="number"
                    min={1}
                    value={editMaxRedemptions}
                    onChange={(e) => setEditMaxRedemptions(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    placeholder="e.g. 100"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expiry date (optional)</label>
                  <input
                    type="date"
                    value={editExpiresAt}
                    onChange={(e) => setEditExpiresAt(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scope</label>
                  <select
                    value={editScopeType}
                    onChange={(e) =>
                      setEditScopeType(
                        e.target.value === 'PROPERTY' ? 'PROPERTY' : e.target.value === 'UNIT' ? 'UNIT' : 'GLOBAL',
                      )
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="GLOBAL">All properties</option>
                    <option value="PROPERTY">Specific property</option>
                    <option value="UNIT">Specific unit</option>
                  </select>
                </div>
                {editScopeType === 'PROPERTY' ? (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Property</label>
                    <select
                      value={editPropertyId}
                      onChange={(e) => setEditPropertyId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    >
                      {properties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {editScopeType === 'UNIT' ? (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium">Unit</label>
                    <select
                      value={editUnitId}
                      onChange={(e) => setEditUnitId(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    >
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.propertyName} — {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setEditOpen(false)} disabled={pending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? 'Saving…' : 'Save'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
