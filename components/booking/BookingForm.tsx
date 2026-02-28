'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';
import { createBookingStub, quoteBooking } from '@/app/book/[unitSlug]/actions';
import { parseDateOnly } from '@/lib/dateOnly';
import { calculatePrice } from '@/lib/pricing';

export function BookingForm(props: {
  unitSlug: string;
  minNights: number;
  maxGuests: number;
  pricing: {
    baseNightly: number;
    weekendNightly: number | null;
    cleaningFee: number;
    depositFee: number;
  };
  paystackEnabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [adults, setAdults] = React.useState(1);
  const [children, setChildren] = React.useState(0);
  const [guestName, setGuestName] = React.useState('');
  const [guestEmail, setGuestEmail] = React.useState('');
  const [guestPhone, setGuestPhone] = React.useState('');
  const [payMode, setPayMode] = React.useState<'PAY_LATER' | 'PAY_NOW'>('PAY_LATER');
  const [promoCode, setPromoCode] = React.useState('');
  const [quote, setQuote] = React.useState<{
    nights: number;
    nightlyTotal: number;
    cleaningFee: number;
    depositFee: number;
    discountAmount: number;
    total: number;
    promoApplied: { code: string; type?: string; amount?: number } | null;
  } | null>(null);
  const [quotePending, startQuoteTransition] = React.useTransition();

  const pricePreview = React.useMemo(() => {
    const ci = parseDateOnly(checkIn);
    const co = parseDateOnly(checkOut);
    if (!ci || !co) return null;
    if (co <= ci) return null;
    return calculatePrice({
      checkIn: ci,
      checkOut: co,
      baseNightly: props.pricing.baseNightly,
      weekendNightly: props.pricing.weekendNightly,
      cleaningFee: props.pricing.cleaningFee,
      depositFee: props.pricing.depositFee,
    });
  }, [checkIn, checkOut, props.pricing.baseNightly, props.pricing.weekendNightly, props.pricing.cleaningFee, props.pricing.depositFee]);

  React.useEffect(() => {
    setQuote(null);
  }, [checkIn, checkOut, adults, children, promoCode]);

  const onApplyPromo = () => {
    if (!promoCode.trim()) {
      toast.error('Enter a promo code');
      return;
    }
    if (!checkIn || !checkOut) {
      toast.error('Select dates first');
      return;
    }
    startQuoteTransition(async () => {
      try {
        const res = await quoteBooking({
          unitSlug: props.unitSlug,
          checkIn,
          checkOut,
          adults,
          children,
          promoCode,
        });
        setQuote(res);
        if (res.discountAmount > 0 && res.promoApplied?.code) {
          toast.success('Promo applied', { description: res.promoApplied.code });
        } else {
          toast.success('Quote updated');
        }
      } catch (err) {
        setQuote(null);
        toast.error('Could not apply promo', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await createBookingStub({
          unitSlug: props.unitSlug,
          checkIn,
          checkOut,
          adults,
          children,
          guestName,
          guestEmail,
          guestPhone,
          payMode,
          promoCode,
        });
        if ('paystackUrl' in res && typeof res.paystackUrl === 'string') {
          toast.success('Redirecting to Paystack…', {
            description: `Booking code: ${res.bookingCode}`,
          });
          window.location.href = res.paystackUrl;
          return;
        }

        toast.success('Booking received', {
          description: `Your booking code is ${res.bookingCode}`,
        });
        router.push(`/booking/${res.bookingCode}`);
      } catch (err) {
        toast.error('Could not create booking', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Check-in</label>
          <input
            type="date"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Check-out</label>
          <input
            type="date"
            required
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Adults</label>
          <input
            type="number"
            min={1}
            max={props.maxGuests}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Children</label>
          <input
            type="number"
            min={0}
            max={Math.max(0, props.maxGuests - 1)}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700">
        <div>Minimum stay: {props.minNights} nights.</div>
        <div>Max guests: {props.maxGuests}.</div>
        <div className="mt-2 text-zinc-600">KYC docs are required before confirmation.</div>
      </div>

      {pricePreview ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4">
          <div className="text-sm font-semibold">Price breakdown</div>
          <div className="mt-3 space-y-1 text-sm text-zinc-700">
            <div className="flex items-center justify-between gap-4">
              <span>
                Nightly ({(quote?.nights ?? pricePreview.nights)} nights)
              </span>
              <span className="font-medium">₦{(quote?.nightlyTotal ?? pricePreview.nightlyTotal).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Cleaning fee</span>
              <span className="font-medium">₦{(quote?.cleaningFee ?? pricePreview.cleaningFee).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Refundable deposit</span>
              <span className="font-medium">₦{(quote?.depositFee ?? pricePreview.depositFee).toLocaleString()}</span>
            </div>
            {quote?.discountAmount ? (
              <div className="flex items-center justify-between gap-4">
                <span>
                  Discount{quote.promoApplied?.code ? ` (${quote.promoApplied.code})` : ''}
                </span>
                <span className="font-medium">-₦{quote.discountAmount.toLocaleString()}</span>
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between gap-4 border-t border-zinc-200 pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">
                ₦{(quote?.total ?? pricePreview.total).toLocaleString()}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Final total is confirmed after availability checks and admin verification.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
          Select valid dates to see price breakdown.
        </div>
      )}

      <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="text-sm font-semibold">Promo code (optional)</div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="e.g. OTA10"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
          <Button type="button" variant="secondary" onClick={onApplyPromo} disabled={quotePending || pending}>
            {quotePending ? 'Applying…' : 'Apply'}
          </Button>
        </div>
        {quote?.discountAmount ? (
          <div className="text-xs text-zinc-600">
            Applied: <span className="font-semibold text-zinc-900">{quote.promoApplied?.code}</span> • Discount:{' '}
            <span className="font-semibold text-zinc-900">₦{quote.discountAmount.toLocaleString()}</span>
          </div>
        ) : promoCode.trim() && !quote ? (
          <div className="text-xs text-zinc-600">Tip: click Apply to validate the promo code.</div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Full name</label>
          <input
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            required
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Phone</label>
          <input
            required
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold">Payment preference</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPayMode('PAY_LATER')}
            className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
              payMode === 'PAY_LATER'
                ? 'border-zinc-900 bg-white'
                : 'border-zinc-200 bg-white hover:border-zinc-300'
            }`}
          >
            <div className="font-semibold">Pay later</div>
            <div className="mt-1 text-xs text-zinc-600">Submit booking, admin confirms.</div>
          </button>
          {props.paystackEnabled ? (
            <button
              type="button"
              onClick={() => setPayMode('PAY_NOW')}
              className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                payMode === 'PAY_NOW'
                  ? 'border-zinc-900 bg-white'
                  : 'border-zinc-200 bg-white hover:border-zinc-300'
              }`}
            >
              <div className="font-semibold">Pay now</div>
              <div className="mt-1 text-xs text-zinc-600">Paystack checkout (optional).</div>
            </button>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left text-sm text-zinc-600">
              Pay Now is currently unavailable.
            </div>
          )}
        </div>
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? 'Submitting…' : 'Confirm booking'}
      </Button>
    </form>
  );
}
