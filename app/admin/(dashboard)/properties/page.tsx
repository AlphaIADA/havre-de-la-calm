import { PropertiesManager } from '@/components/admin/PropertiesManager';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Properties' };
export const dynamic = 'force-dynamic';

export default async function AdminPropertiesPage() {
  const prisma = getPrisma();
  const properties = await prisma.property.findMany({ orderBy: { createdAt: 'desc' } });
  return <PropertiesManager properties={properties} />;
}

