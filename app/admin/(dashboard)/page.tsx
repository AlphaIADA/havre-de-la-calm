import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { getPrisma } from '@/lib/prisma';

export const metadata = {
  title: 'Overview',
};

export const dynamic = 'force-dynamic';

function utcDayRange(date: Date) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + 1, 0, 0, 0));
  return { start, end };
}

export default async function AdminOverviewPage() {
  const prisma = getPrisma();
  const now = new Date();
  const { start, end } = utcDayRange(now);

  const [totalProperties, totalUnits, pendingKyc, todayCheckins, todayCheckouts, activeStays] =
    await Promise.all([
      prisma.property.count({ where: { active: true } }),
      prisma.unit.count({ where: { active: true } }),
      prisma.kycProfile.count({ where: { status: 'PENDING' } }),
      prisma.booking.count({
        where: {
          checkIn: { gte: start, lt: end },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
      }),
      prisma.booking.count({
        where: {
          checkOut: { gte: start, lt: end },
          status: { in: ['CHECKED_IN', 'CHECKED_OUT', 'CONFIRMED'] },
        },
      }),
      prisma.booking.count({
        where: {
          checkIn: { lte: now },
          checkOut: { gt: now },
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
      }),
    ]);

  const occupancyPct = totalUnits ? Math.round((activeStays / totalUnits) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-base font-semibold">Overview</h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold text-zinc-500">Today check-ins</div>
          <div className="mt-2 text-2xl font-semibold">{todayCheckins}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold text-zinc-500">Today check-outs</div>
          <div className="mt-2 text-2xl font-semibold">{todayCheckouts}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-xs font-semibold text-zinc-500">Occupancy</div>
          <div className="mt-2 text-2xl font-semibold">{occupancyPct}%</div>
          <div className="mt-1 text-xs text-zinc-500">
            {activeStays} active / {totalUnits} units
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-xs font-semibold text-zinc-500">Pending KYCs</div>
          <div className="mt-2 text-2xl font-semibold">{pendingKyc}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-xs font-semibold text-zinc-500">Properties</div>
          <div className="mt-2 text-2xl font-semibold">{totalProperties}</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-xs font-semibold text-zinc-500">Units</div>
          <div className="mt-2 text-2xl font-semibold">{totalUnits}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/admin/bookings">
          <Button variant="secondary">Manage bookings</Button>
        </Link>
        <Link href="/admin/kyc">
          <Button variant="secondary">Review KYC</Button>
        </Link>
        <Link href="/admin/properties">
          <Button variant="secondary">Properties</Button>
        </Link>
        <Link href="/admin/units">
          <Button variant="secondary">Units</Button>
        </Link>
      </div>
    </div>
  );
}
