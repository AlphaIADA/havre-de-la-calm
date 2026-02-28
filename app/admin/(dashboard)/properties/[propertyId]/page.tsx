import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PropertyEditor } from '@/components/admin/PropertyEditor';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Edit property' };
export const dynamic = 'force-dynamic';

export default async function AdminPropertyEditPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const prisma = getPrisma();
  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/properties" className="text-sm font-medium text-zinc-900 hover:underline">
        ← Back to properties
      </Link>
      <PropertyEditor property={property} />
    </div>
  );
}

