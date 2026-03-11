'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { differenceInCalendarDays } from 'date-fns';
import { ChevronLeft, ChevronRight, MapPin, Search, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { parseDateOnly } from '@/lib/dateOnly';
import { calculatePrice } from '@/lib/pricing';

export type HomeStayFinderUnit = {
  slug: string;
  name: string;
  maxGuests: number;
  minNights: number;
  baseNightly: number;
  weekendNightly: number | null;
  cleaningFee: number;
  depositFee: number;
  images: string[];
  property: {
    slug: string;
    name: string;
    location: string;
  };
};

type AreaFilter = 'ALL' | 'OTA' | 'SANGO_OTA';

function classifyArea(location: string): Exclude<AreaFilter, 'ALL'> | null {
  const value = (location ?? '').toLowerCase();
  if (!value) return null;
  if (value.includes('sango')) return 'SANGO_OTA';
  if (value.includes('ota')) return 'OTA';
  return null;
}

function formatMoney(amount: number) {
  return `₦${Math.max(0, Math.round(amount)).toLocaleString()}`;
}

export function HomeStayFinder({ units }: { units: HomeStayFinderUnit[] }) {
  const carouselRef = React.useRef<HTMLDivElement | null>(null);

  const [area, setArea] = React.useState<AreaFilter>('ALL');
  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [adults, setAdults] = React.useState(1);
  const [children, setChildren] = React.useState(0);
  const [maxNightly, setMaxNightly] = React.useState<number | ''>('');

  const checkInDate = React.useMemo(() => (checkIn ? parseDateOnly(checkIn) : null), [checkIn]);
  const checkOutDate = React.useMemo(() => (checkOut ? parseDateOnly(checkOut) : null), [checkOut]);

  const nights = React.useMemo(() => {
    if (!checkInDate || !checkOutDate) return 0;
    return Math.max(0, differenceInCalendarDays(checkOutDate, checkInDate));
  }, [checkInDate, checkOutDate]);

  const dateError = React.useMemo(() => {
    if (!checkIn && !checkOut) return null;
    if ((checkIn && !checkInDate) || (checkOut && !checkOutDate)) return 'Enter valid dates.';
    if (checkInDate && checkOutDate && checkOutDate <= checkInDate) return 'Check-out must be after check-in.';
    return null;
  }, [checkIn, checkInDate, checkOut, checkOutDate]);

  const guestCount = Math.max(1, adults) + Math.max(0, children);

  const filtered = React.useMemo(() => {
    const budget = maxNightly === '' ? null : Number(maxNightly);

    return (units ?? []).filter((u) => {
      if (area !== 'ALL') {
        const unitArea = classifyArea(u.property.location);
        if (unitArea !== area) return false;
      }
      if (guestCount > u.maxGuests) return false;
      if (budget !== null && Number.isFinite(budget) && budget > 0 && u.baseNightly > budget) return false;
      if (nights > 0 && nights < u.minNights) return false;
      return true;
    });
  }, [area, guestCount, maxNightly, nights, units]);

  const picks = filtered.slice(0, 12);

  const scrollCarousel = (dir: -1 | 1) => {
    const el = carouselRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(280, el.clientWidth * 0.9), behavior: 'smooth' });
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError) {
      toast.error('Fix your dates', { description: dateError });
      return;
    }
    if (!filtered.length) {
      toast.message('No matches yet', { description: 'Try increasing budget or reducing guest count.' });
      return;
    }
    carouselRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <h2 className="text-2xl font-semibold tracking-tight">Find your stay</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Filter by location, dates, guests, and budget. We’ll show the best matches instantly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link
              href="/ota"
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
            >
              <MapPin className="h-3.5 w-3.5" /> Ota guide
            </Link>
            <Link
              href="/sango-ota"
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
            >
              <MapPin className="h-3.5 w-3.5" /> Sango‑Ota guide
            </Link>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
            >
              <Search className="h-3.5 w-3.5" /> View all properties
            </Link>
          </div>
        </div>

        <form
          onSubmit={onSearch}
          className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-7"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as AreaFilter)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
              >
                <option value="ALL">All locations</option>
                <option value="OTA">Ota</option>
                <option value="SANGO_OTA">Sango‑Ota</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Guests</label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-zinc-500">Adults</div>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={adults}
                    onChange={(e) => setAdults(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-zinc-500">Children</div>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={children}
                    onChange={(e) => setChildren(Number(e.target.value))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Users className="h-3.5 w-3.5" />
                Total guests: {guestCount}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Check‑in</label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className={cn(
                  'w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2',
                  dateError ? 'border-rose-300 focus:ring-rose-500/20' : 'border-zinc-200 focus:ring-zinc-900/15',
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Check‑out</label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={cn(
                  'w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none focus:ring-2',
                  dateError ? 'border-rose-300 focus:ring-rose-500/20' : 'border-zinc-200 focus:ring-zinc-900/15',
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Max nightly budget (optional)</label>
              <input
                type="number"
                min={0}
                value={maxNightly}
                onChange={(e) => setMaxNightly(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
                placeholder="E.g. 50000"
              />
              {dateError ? <div className="text-xs text-rose-600">{dateError}</div> : null}
              {nights > 0 ? <div className="text-xs text-zinc-500">Selected: {nights} nights</div> : null}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-500">
              Showing <span className="font-semibold text-zinc-900">{filtered.length}</span> matches
            </div>
            <Button type="submit">Show matches</Button>
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Top picks</div>
            <div className="mt-1 text-xs text-zinc-600">
              Tap a stay to view photos and amenities, then book in minutes.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {picks.length ? (
          <div
            ref={carouselRef}
            className="mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
          >
            {picks.map((u) => {
              const cover = u.images?.[0] ?? '/images/bg_1.jpg';
              const showEstimate = Boolean(checkInDate && checkOutDate && !dateError && nights > 0);
              const estimate = showEstimate
                ? calculatePrice({
                    checkIn: checkInDate as Date,
                    checkOut: checkOutDate as Date,
                    baseNightly: u.baseNightly,
                    weekendNightly: u.weekendNightly,
                    cleaningFee: u.cleaningFee,
                    depositFee: u.depositFee,
                  })
                : null;

              return (
                <div
                  key={u.slug}
                  className="w-[280px] shrink-0 snap-start overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm sm:w-[320px]"
                >
                  <Link href={`/stay/${u.slug}`} className="block">
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={cover}
                        alt={u.name}
                        fill
                        sizes="320px"
                        className="object-cover"
                      />
                    </div>
                  </Link>
                  <div className="p-4">
                    <div className="text-xs text-zinc-500">{u.property.location}</div>
                    <div className="mt-1 text-base font-semibold">{u.name}</div>
                    <div className="mt-1 text-xs text-zinc-600">{u.property.name}</div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-700">
                        Max {u.maxGuests} guests
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-700">
                        Min {u.minNights} nights
                      </span>
                    </div>

                    <div className="mt-4">
                      {estimate ? (
                        <>
                          <div className="text-sm font-semibold text-zinc-900">
                            Est. {formatMoney(estimate.total)}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {estimate.nights} nights • includes booking fee + refundable deposit
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-semibold text-zinc-900">
                            From {formatMoney(u.baseNightly)} / night
                          </div>
                          <div className="text-xs text-zinc-500">Select dates for an estimate.</div>
                        </>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/stay/${u.slug}`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:border-zinc-300 hover:text-zinc-900"
                      >
                        View
                      </Link>
                      <Link href={`/book/${u.slug}`} className="flex-1">
                        <Button className="w-full py-2 text-xs">Book</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
            No stays match your filters yet. Try increasing your budget or adjusting guest count.
          </div>
        )}
      </div>
    </div>
  );
}

