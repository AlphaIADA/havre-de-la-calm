import { OfflineCheckinForm } from '@/components/checkin/OfflineCheckinForm';
import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';
import { demoProperties, demoUnits } from '@/lib/demoData';

export const dynamic = 'force-dynamic';

export default async function CheckinNewPage() {
  if (!isDbConfigured()) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Offline check-in is not available yet. Please contact an administrator to complete setup.
      </div>
    );
  }

  const prisma = getPrisma();
  const [properties, units] = await Promise.all([
    prisma.property.findMany({
      where: { active: true },
      select: { slug: true, name: true, location: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.unit.findMany({
      where: { active: true },
      select: { slug: true, name: true, maxGuests: true, property: { select: { slug: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const props = properties.length ? properties : demoProperties.map((p) => ({ slug: p.slug, name: p.name, location: p.location }));
  const us = units.length
    ? units.map((u) => ({ slug: u.slug, name: u.name, maxGuests: u.maxGuests, propertySlug: u.property.slug }))
    : demoUnits.map((u) => ({ slug: u.slug, name: u.name, maxGuests: u.maxGuests, propertySlug: u.propertySlug }));

  return <OfflineCheckinForm properties={props} units={us} />;
}
