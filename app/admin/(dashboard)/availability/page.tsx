import { AvailabilityManager } from '@/components/admin/AvailabilityManager';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Availability' };
export const dynamic = 'force-dynamic';

export default async function AdminAvailabilityPage() {
  const prisma = getPrisma();
  const [units, blocks] = await Promise.all([
    prisma.unit.findMany({ include: { property: true }, orderBy: { createdAt: 'desc' }, take: 500 }),
    prisma.availabilityBlock.findMany({ include: { unit: { include: { property: true } } }, orderBy: { startDate: 'desc' }, take: 200 }),
  ]);

  const unitOptions = units.map((u) => ({ id: u.id, name: u.name, propertyName: u.property.name }));
  const viewBlocks = blocks.map((b) => ({
    id: b.id,
    unitName: b.unit.name,
    propertyName: b.unit.property.name,
    startDate: b.startDate.toISOString().slice(0, 10),
    endDate: b.endDate.toISOString().slice(0, 10),
    reason: b.reason ?? null,
  }));

  return <AvailabilityManager units={unitOptions} blocks={viewBlocks} />;
}

