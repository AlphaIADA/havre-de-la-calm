import { UnitsManager } from '@/components/admin/UnitsManager';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Units' };
export const dynamic = 'force-dynamic';

export default async function AdminUnitsPage() {
  const prisma = getPrisma();
  const [properties, units] = await Promise.all([
    prisma.property.findMany({ where: { active: true }, orderBy: { createdAt: 'desc' }, select: { id: true, name: true } }),
    prisma.unit.findMany({ include: { property: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
  ]);

  return <UnitsManager units={units} properties={properties} />;
}

