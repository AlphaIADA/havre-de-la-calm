import Link from 'next/link';
import { notFound } from 'next/navigation';

import { UnitInquiryForm } from '@/components/booking/UnitInquiryForm';
import { StayGallery } from '@/components/stay/StayGallery';
import { Button } from '@/components/ui/Button';
import { demoProperties, getDemoUnitBySlug } from '@/lib/demoData';
import { getUnitBySlug, jsonStringArray } from '@/lib/data/properties';
import { isDbConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function StayPage({ params }: { params: Promise<{ unitSlug: string }> }) {
  const { unitSlug } = await params;
  const dbEnabled = isDbConfigured();
  const dbUnit = dbEnabled ? await getUnitBySlug(unitSlug) : null;

  const unit = dbUnit
    ? {
        slug: dbUnit.slug,
        propertySlug: dbUnit.property.slug,
        name: dbUnit.name,
        summary: dbUnit.summary ?? '',
        maxGuests: dbUnit.maxGuests,
        minNights: dbUnit.minNights,
        baseNightly: dbUnit.baseNightly,
        images: jsonStringArray(dbUnit.images),
        amenities: jsonStringArray(dbUnit.amenities),
        rules: jsonStringArray(dbUnit.rules),
      }
    : getDemoUnitBySlug(unitSlug);

  if (!unit) return notFound();

  const property = dbUnit
    ? {
        slug: dbUnit.property.slug,
        name: dbUnit.property.name,
        location: dbUnit.property.location,
      }
    : (demoProperties.find((p) => p.slug === unit.propertySlug) ?? null);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://otaapartments.com').replace(/\/$/, '');
  const jsonLdImage =
    unit.images?.[0] && unit.images[0].startsWith('http')
      ? unit.images[0]
      : unit.images?.[0]
        ? `${baseUrl}${unit.images[0]}`
        : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Accommodation',
    '@id': `${baseUrl}/stay/${unit.slug}#stay`,
    url: `${baseUrl}/stay/${unit.slug}`,
    name: property ? `${unit.name} — ${property.name}` : unit.name,
    description: unit.summary,
    image: jsonLdImage ? [jsonLdImage] : undefined,
    amenityFeature: (unit.amenities ?? []).map((a) => ({
      '@type': 'LocationFeatureSpecification',
      name: a,
      value: true,
    })),
    occupancy: {
      '@type': 'QuantitativeValue',
      maxValue: unit.maxGuests,
    },
  };

  return (
    <div className="container-px py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-zinc-600">{property?.location ?? 'OTA Apartments'}</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{unit.name}</h1>
            <p className="text-sm text-zinc-700">{unit.summary}</p>
          </div>

          <StayGallery images={unit.images} alt={unit.name} />

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <div className="rounded-3xl border border-zinc-200 bg-white p-6">
              <h2 className="text-base font-semibold">Amenities</h2>
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-zinc-700">
                {unit.amenities.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-white p-6">
              <h2 className="text-base font-semibold">House rules</h2>
              <ul className="mt-3 grid list-disc gap-2 pl-5 text-sm text-zinc-700">
                {unit.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-base font-semibold">Availability</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Select dates in the booking flow to see real-time availability (maintenance blocks
              and confirmed stays).
            </p>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="sticky top-6 space-y-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-sm text-zinc-500">from</div>
                <div className="text-2xl font-semibold">₦{unit.baseNightly.toLocaleString()}</div>
                <div className="text-xs text-zinc-500">per night</div>
              </div>
              <div className="text-right text-sm text-zinc-600">
                Max {unit.maxGuests}
                <div className="text-xs text-zinc-500">Min {unit.minNights} nights</div>
              </div>
            </div>

            <Link href={`/book/${unit.slug}`}>
              <Button className="w-full">Book now</Button>
            </Link>

            <div className="text-xs text-zinc-500">
              KYC is required before confirmation. Pay now is optional (shown only if enabled).
            </div>

            {property?.slug ? (
              <Link href={`/properties/${property.slug}`} className="text-sm font-medium text-zinc-900 hover:underline">
                Back to {property.name}
              </Link>
            ) : null}

            <div className="border-t border-zinc-200 pt-4">
              <UnitInquiryForm unitSlug={unit.slug} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
