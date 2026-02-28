'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

export type BookingRow = {
  id: string;
  code: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  payMode: 'PAY_NOW' | 'PAY_LATER';
  totalAmount: number;
  currency: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  unitName: string;
  propertyName: string;
};

const statuses: BookingRow['status'][] = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'CHECKED_OUT',
  'CANCELLED',
];

function isBookingStatus(value: string): value is BookingRow['status'] {
  return (statuses as string[]).includes(value);
}

export function BookingsManager({ bookings }: { bookings: BookingRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [query, setQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'ALL' | BookingRow['status']>('ALL');
  const checkinUrl = React.useMemo(() => {
    const root = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? '').trim();
    if (root) return `https://checkin.${root}`;
    return '/checkin/new';
  }, []);

  const filtered = bookings.filter((b) => {
    if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      b.code.toLowerCase().includes(q) ||
      b.guestEmail.toLowerCase().includes(q) ||
      b.guestName.toLowerCase().includes(q) ||
      b.unitName.toLowerCase().includes(q) ||
      b.propertyName.toLowerCase().includes(q)
    );
  });

  const updateStatus = (bookingId: string, status: BookingRow['status']) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Update failed');
        }
        toast.success('Booking updated');
        router.refresh();
      } catch (err) {
        toast.error('Could not update booking', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const markOfflinePaid = (bookingId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ markOfflinePaymentReceived: true }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Update failed');
        }
        toast.success('Offline payment recorded');
        router.refresh();
      } catch (err) {
        toast.error('Could not record payment', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Bookings</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Search, filter, update status, edit dates/prices, and record offline payments.
          </p>
        </div>
        <a
          href={checkinUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
        >
          New offline booking
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code, guest, unit…"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            const value = e.target.value;
            setStatusFilter(value === 'ALL' ? 'ALL' : isBookingStatus(value) ? value : 'ALL');
          }}
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
        >
          <option value="ALL">All statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Stay</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Dates</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-t border-zinc-200">
                <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{b.unitName}</div>
                  <div className="text-xs text-zinc-500">{b.propertyName}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{b.guestName}</div>
                  <div className="text-xs text-zinc-500">{b.guestEmail}</div>
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  <div className="text-xs">{b.checkIn} → {b.checkOut}</div>
                </td>
                <td className="px-4 py-3 text-zinc-700">
                  ₦{b.totalAmount.toLocaleString()} <span className="text-xs text-zinc-500">{b.payMode}</span>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={b.status}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (isBookingStatus(value)) updateStatus(b.id, value);
                    }}
                    className="rounded-xl border border-zinc-200 bg-white px-2 py-1 text-xs"
                    disabled={pending}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                    >
                      Edit
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-8 px-3 py-1 text-xs"
                      onClick={() => markOfflinePaid(b.id)}
                      disabled={pending}
                    >
                      Mark paid
                    </Button>
                    <a
                      className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                      href={`/booking/${b.code}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Guest view
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-600" colSpan={7}>
                  No bookings found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
