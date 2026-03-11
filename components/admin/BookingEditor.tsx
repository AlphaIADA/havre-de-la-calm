'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

type PaymentRow = {
  id: string;
  provider: string;
  status: string;
  amount: number;
  reference: string;
  createdAt: string;
};

type Booking = {
  id: string;
  code: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  payMode: 'PAY_NOW' | 'PAY_LATER';
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  propertyName: string;
  unitName: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  nightlyTotal: number;
  cleaningFee: number;
  depositFee: number;
  extraCharges: Array<{ label: string; amount: number }>;
  discountAmount: number;
  totalAmount: number;
  promoCode: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
  payments: PaymentRow[];
};

const statuses: Booking['status'][] = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
];

export function BookingEditor({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [status, setStatus] = React.useState<Booking['status']>(booking.status);
  const [checkIn, setCheckIn] = React.useState(booking.checkIn);
  const [checkOut, setCheckOut] = React.useState(booking.checkOut);
  const [adults, setAdults] = React.useState(booking.adults);
  const [children, setChildren] = React.useState(booking.children);
  const [nightlyTotal, setNightlyTotal] = React.useState(booking.nightlyTotal);
  const [cleaningFee, setCleaningFee] = React.useState(booking.cleaningFee);
  const [depositFee, setDepositFee] = React.useState(booking.depositFee);
  const [extraCharges, setExtraCharges] = React.useState<Array<{ label: string; amount: number }>>(
    booking.extraCharges ?? [],
  );
  const [discountAmount, setDiscountAmount] = React.useState(booking.discountAmount);
  const [notes, setNotes] = React.useState(booking.notes);
  const [recalculatePricing, setRecalculatePricing] = React.useState(false);

  const datesChanged = checkIn !== booking.checkIn || checkOut !== booking.checkOut;
  const autoPricing = recalculatePricing || datesChanged;
  const extraChargesTotal = extraCharges.reduce((sum, c) => sum + (Number.isFinite(c.amount) ? c.amount : 0), 0);
  const totalPreview = Math.max(0, nightlyTotal - discountAmount + cleaningFee + depositFee + extraChargesTotal);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload: Record<string, unknown> = {
          status,
          checkIn,
          checkOut,
          adults,
          children,
          discountAmount,
          extraCharges: extraCharges
            .map((c) => ({ label: c.label.trim(), amount: Math.floor(Number(c.amount)) }))
            .filter((c) => c.label && Number.isFinite(c.amount) && c.amount >= 0),
          notes: notes.trim() ? notes.trim() : null,
          recalculatePricing,
        };

        if (!autoPricing) {
          payload.nightlyTotal = nightlyTotal;
          payload.cleaningFee = cleaningFee;
          payload.depositFee = depositFee;
        }

        const res = await fetch(`/api/admin/bookings/${booking.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Save failed');
        toast.success('Booking saved');
        setRecalculatePricing(false);
        router.refresh();
      } catch (err) {
        toast.error('Could not save booking', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs text-zinc-500">
            {booking.propertyName} • {booking.unitName}
          </div>
          <h2 className="text-base font-semibold">Booking {booking.code}</h2>
          <div className="mt-1 text-xs text-zinc-500">
            Created {booking.createdAt.slice(0, 10)} • Updated {booking.updatedAt.slice(0, 10)}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/booking/${booking.code}`}
            target="_blank"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
          >
            Guest portal
          </Link>
          <Link
            href="/checkin/new"
            target="_blank"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
          >
            New offline booking
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <form onSubmit={onSave} className="space-y-4 lg:col-span-8">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold">Guest</div>
            <div className="mt-3 grid gap-2 text-sm text-zinc-700">
              <div>
                <span className="text-zinc-500">Name:</span> <span className="font-medium">{booking.guestName}</span>
              </div>
              <div>
                <span className="text-zinc-500">Email:</span> <span className="font-medium">{booking.guestEmail}</span>
              </div>
              <div>
                <span className="text-zinc-500">Phone:</span> <span className="font-medium">{booking.guestPhone}</span>
              </div>
              {booking.promoCode ? (
                <div>
                  <span className="text-zinc-500">Promo:</span> <span className="font-medium">{booking.promoCode}</span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold">Stay</div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Booking['status'])}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  disabled={pending}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pay mode</label>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
                  {booking.payMode}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Adults</label>
                <input
                  type="number"
                  min={1}
                  value={adults}
                  onChange={(e) => setAdults(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Children</label>
                <input
                  type="number"
                  min={0}
                  value={children}
                  onChange={(e) => setChildren(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-zinc-600">
              <input
                id="recalc"
                type="checkbox"
                checked={recalculatePricing}
                onChange={(e) => setRecalculatePricing(e.target.checked)}
              />
              <label htmlFor="recalc">Recalculate pricing from current unit rates</label>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold">Pricing</div>
            <p className="mt-2 text-xs text-zinc-500">Total updates automatically when you save.</p>
            {autoPricing ? (
              <p className="mt-2 text-xs text-zinc-600">
                Pricing will be recalculated on save. After saving, you can override values if needed.
              </p>
            ) : null}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nightly total</label>
                <input
                  type="number"
                  min={0}
                  value={nightlyTotal}
                  onChange={(e) => setNightlyTotal(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  disabled={autoPricing}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Discount</label>
                <input
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Booking fee</label>
                <input
                  type="number"
                  min={0}
                  value={cleaningFee}
                  onChange={(e) => setCleaningFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  disabled={autoPricing}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Deposit</label>
                <input
                  type="number"
                  min={0}
                  value={depositFee}
                  onChange={(e) => setDepositFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  disabled={autoPricing}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold">Extra charges (optional)</div>
              <p className="mt-1 text-xs text-zinc-500">Add-ons like late checkout, extra guest, or damages.</p>
              <div className="mt-3 space-y-3">
                {extraCharges.map((c, idx) => (
                  <div key={idx} className="grid gap-3 sm:grid-cols-6 sm:items-end">
                    <div className="space-y-2 sm:col-span-4">
                      <label className="sr-only">Charge label</label>
                      <input
                        value={c.label}
                        onChange={(e) =>
                          setExtraCharges((current) =>
                            current.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)),
                          )
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                        placeholder="Charge label"
                        disabled={pending}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <label className="sr-only">Amount (NGN)</label>
                      <input
                        type="number"
                        min={0}
                        value={c.amount}
                        onChange={(e) =>
                          setExtraCharges((current) =>
                            current.map((x, i) => (i === idx ? { ...x, amount: Number(e.target.value) } : x)),
                          )
                        }
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                        placeholder="0"
                        disabled={pending}
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <button
                        type="button"
                        onClick={() => setExtraCharges((current) => current.filter((_, i) => i !== idx))}
                        className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                        disabled={pending}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {!extraCharges.length ? (
                  <div className="text-sm text-zinc-600">No extra charges.</div>
                ) : null}

                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setExtraCharges((current) => [...current, { label: '', amount: 0 }])}
                  disabled={pending || extraCharges.length >= 20}
                >
                  Add charge
                </Button>

                {extraChargesTotal ? (
                  <div className="text-xs text-zinc-500">
                    Extra charges total: <span className="font-semibold text-zinc-900">₦{extraChargesTotal.toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold">Total (preview)</span>
                <span className="font-semibold">₦{totalPreview.toLocaleString()}</span>
              </div>
              <div className="mt-2 text-xs text-zinc-500">
                Current stored total: ₦{booking.totalAmount.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold">Internal notes</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="mt-3 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Notes visible to staff only"
            />
          </div>

          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </form>

        <aside className="space-y-4 lg:col-span-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold">Payments</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-700">
              {!booking.payments.length ? (
                <div className="text-sm text-zinc-600">No payments recorded.</div>
              ) : (
                booking.payments.map((p) => (
                  <div key={p.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="font-medium">{p.provider}</div>
                      <div className="text-xs text-zinc-500">{p.status}</div>
                    </div>
                    <div className="mt-1 text-xs text-zinc-600">{p.reference}</div>
                    <div className="mt-2 text-sm font-semibold">₦{p.amount.toLocaleString()}</div>
                    <div className="mt-1 text-xs text-zinc-500">{p.createdAt.slice(0, 10)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
