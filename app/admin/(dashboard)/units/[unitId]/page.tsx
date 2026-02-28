import Link from 'next/link';
import { notFound } from 'next/navigation';

import { UnitEditor } from '@/components/admin/UnitEditor';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Edit unit' };
export const dynamic = 'force-dynamic';

export default async function AdminUnitEditPage({ params }: { params: Promise<{ unitId: string }> }) {
  const { unitId } = await params;
  const prisma = getPrisma();
  const unit = await prisma.unit.findUnique({
    where: { id: unitId },
    select: {
      id: true,
      slug: true,
      name: true,
      summary: true,
      maxGuests: true,
      minNights: true,
      baseNightly: true,
      weekendNightly: true,
      cleaningFee: true,
      depositFee: true,
      images: true,
      amenities: true,
      rules: true,
      active: true,
      property: { select: { name: true } },
    },
  });

  if (!unit) return notFound();

  const toStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((v) => typeof v === 'string') as string[];
  };

  return (
    <div className="space-y-6">
      <Link href="/admin/units" className="text-sm font-medium text-zinc-900 hover:underline">
        ← Back to units
      </Link>
      <UnitEditor
        unit={{
          id: unit.id,
          slug: unit.slug,
          propertyName: unit.property.name,
          name: unit.name,
          summary: unit.summary ?? null,
          maxGuests: unit.maxGuests,
          minNights: unit.minNights,
          baseNightly: unit.baseNightly,
          weekendNightly: unit.weekendNightly ?? null,
          cleaningFee: unit.cleaningFee,
          depositFee: unit.depositFee,
          images: toStringArray(unit.images),
          amenities: toStringArray(unit.amenities),
          rules: toStringArray(unit.rules),
          active: unit.active,
        }}
      />
    </div>
  );
}

