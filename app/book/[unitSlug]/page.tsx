import { notFound } from 'next/navigation';

import { BookingForm } from '@/components/booking/BookingForm';
import { getDemoUnitBySlug } from '@/lib/demoData';
import { getUnitBySlug } from '@/lib/data/properties';
import { isDbConfigured, isPaystackConfigured } from '@/lib/env';

export const metadata = {
  title: 'Book',
  description: 'Select dates, guests, and confirm your booking.',
};

export const dynamic = 'force-dynamic';

export default async function BookPage({ params }: { params: Promise<{ unitSlug: string }> }) {
  const { unitSlug } = await params;
  const dbEnabled = isDbConfigured();
  const dbUnit = dbEnabled ? await getUnitBySlug(unitSlug) : null;

  const unit = dbUnit
    ? {
        slug: dbUnit.slug,
        name: dbUnit.name,
        minNights: dbUnit.minNights,
        maxGuests: dbUnit.maxGuests,
        baseNightly: dbUnit.baseNightly,
        weekendNightly: dbUnit.weekendNightly ?? null,
        cleaningFee: dbUnit.cleaningFee,
        depositFee: dbUnit.depositFee,
      }
    : getDemoUnitBySlug(unitSlug);
  if (!unit) return notFound();

  const paystackEnabled = isPaystackConfigured();

  return (
    <div className="container-px py-10">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h1 className="text-3xl font-semibold tracking-tight">Book: {unit.name}</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Secure KYC is required before confirmation. Choose pay later or pay now if enabled.
          </p>

          <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <BookingForm
              unitSlug={unit.slug}
              minNights={unit.minNights}
              maxGuests={unit.maxGuests}
              pricing={{
                baseNightly: unit.baseNightly,
                weekendNightly: unit.weekendNightly ?? null,
                cleaningFee: unit.cleaningFee,
                depositFee: unit.depositFee,
              }}
              paystackEnabled={paystackEnabled}
            />
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <div className="text-sm font-semibold">Price notes</div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-zinc-700">
              <li>Nightly price may differ on weekends.</li>
              <li>Booking fee and refundable deposit may apply.</li>
              <li>Promo codes can be applied during checkout.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
