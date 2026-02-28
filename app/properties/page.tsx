import Image from 'next/image';
import Link from 'next/link';

import { demoProperties } from '@/lib/demoData';
import { listProperties } from '@/lib/data/properties';
import { isDbConfigured } from '@/lib/env';

export const metadata = {
  title: 'Properties',
  description: 'Browse OTA Apartments properties and choose a unit that fits your stay.',
};

export const dynamic = 'force-dynamic';

export default async function PropertiesPage() {
  const properties = isDbConfigured() ? await listProperties() : null;
  const items = properties?.length
    ? properties.map((p) => ({
        slug: p.slug,
        name: p.name,
        location: p.location,
        description: p.description,
        heroImage: p.heroImage ?? '/images/bg_1.jpg',
      }))
    : demoProperties.map((p) => ({
        slug: p.slug,
        name: p.name,
        location: p.location,
        description: p.description,
        heroImage: p.heroImage,
      }));

  return (
    <div className="container-px py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Properties</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Multi-property bookings from day one—choose a location and see available units.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {items.map((p) => (
          <Link
            key={p.slug}
            href={`/properties/${p.slug}`}
            className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-[16/10]">
              <Image src={p.heroImage} alt={p.name} fill className="object-cover transition group-hover:scale-[1.02]" />
            </div>
            <div className="p-5">
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="mt-1 text-sm text-zinc-600">{p.location}</div>
              <p className="mt-3 text-sm text-zinc-700">{p.description}</p>
              <div className="mt-4 text-sm font-medium text-zinc-900">View units →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
