import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Button } from '@/components/ui/Button';
import { getDemoPropertyBySlug, getDemoUnitsForProperty } from '@/lib/demoData';
import { getPropertyBySlug, jsonStringArray, listUnitsForProperty } from '@/lib/data/properties';
import { isDbConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ propertySlug: string }>;
}) {
  const { propertySlug } = await params;
  const dbEnabled = isDbConfigured();
  const dbProperty = dbEnabled ? await getPropertyBySlug(propertySlug) : null;

  const property = dbProperty
    ? {
        slug: dbProperty.slug,
        name: dbProperty.name,
        location: dbProperty.location,
        description: dbProperty.description,
        gallery: jsonStringArray(dbProperty.gallery),
        heroImage: dbProperty.heroImage ?? (jsonStringArray(dbProperty.gallery)[0] ?? '/images/bg_1.jpg'),
      }
    : getDemoPropertyBySlug(propertySlug);

  if (!property) return notFound();

  const dbUnits = dbEnabled && dbProperty ? await listUnitsForProperty(dbProperty.id) : null;
  const units = dbUnits?.length
    ? dbUnits.map((u) => ({
        slug: u.slug,
        name: u.name,
        summary: u.summary ?? '',
        maxGuests: u.maxGuests,
        minNights: u.minNights,
        baseNightly: u.baseNightly,
        images: jsonStringArray(u.images),
      }))
    : getDemoUnitsForProperty(property.slug);

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? 'https://otaapartments.com').replace(/\/$/, '');
  const jsonLdImage =
    property.heroImage && property.heroImage.startsWith('http')
      ? property.heroImage
      : property.heroImage
        ? `${baseUrl}${property.heroImage}`
        : null;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    '@id': `${baseUrl}/properties/${property.slug}#lodging`,
    url: `${baseUrl}/properties/${property.slug}`,
    name: property.name,
    description: property.description,
    image: jsonLdImage ? [jsonLdImage] : undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.location,
      addressCountry: 'NG',
    },
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="border-b border-zinc-200/70">
        <div className="container-px py-10">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-medium text-zinc-600">{property.location}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                {property.name}
              </h1>
              <p className="mt-3 text-sm text-zinc-700">{property.description}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/properties">
                  <Button variant="secondary">Back to properties</Button>
                </Link>
                {units[0]?.slug ? (
                  <Link href={`/stay/${units[0].slug}`}>
                    <Button>View a stay</Button>
                  </Link>
                ) : null}
              </div>
            </div>

            <div className="relative aspect-[16/11] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100">
              <Image src={property.heroImage} alt={property.name} fill className="object-cover" />
            </div>
          </div>

          {property.gallery?.length ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {property.gallery
                .filter((src, idx, arr) => src && arr.indexOf(src) === idx)
                .slice(0, 9)
                .map((src) => (
                  <div
                    key={src}
                    className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
                  >
                    <Image src={src} alt={property.name} fill className="object-cover" />
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="container-px py-10">
        <h2 className="text-xl font-semibold tracking-tight">Units</h2>
        <p className="mt-1 text-sm text-zinc-600">Choose a unit and start your booking.</p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
            {units.map((u) => (
              <Link
                key={u.slug}
                href={`/stay/${u.slug}`}
                className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[16/10]">
                  <Image
                    src={u.images[0] ?? property.heroImage}
                    alt={u.name}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                    <div className="text-base font-semibold">{u.name}</div>
                    <div className="mt-1 text-sm text-zinc-600">
                      Max {u.maxGuests} guests • Min {u.minNights} nights
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500">from</div>
                    <div className="text-base font-semibold">₦{u.baseNightly.toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">per night</div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-700">{u.summary}</p>
                <div className="mt-4 text-sm font-medium text-zinc-900">View details →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
