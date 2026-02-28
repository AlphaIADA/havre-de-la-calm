import { KycManager } from '@/components/admin/KycManager';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'KYC' };
export const dynamic = 'force-dynamic';

export default async function AdminKycPage() {
  const prisma = getPrisma();
  const profiles = await prisma.kycProfile.findMany({
    include: {
      booking: { include: { unit: { include: { property: true } } } },
      documents: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 100,
  });

  const view = profiles.map((p) => ({
    id: p.id,
    status: p.status,
    fullName: p.fullName,
    email: p.email,
    phone: p.phone,
    address: p.address,
    nextOfKinName: p.nextOfKinName,
    nextOfKinPhone: p.nextOfKinPhone,
    emergencyName: p.emergencyName,
    emergencyPhone: p.emergencyPhone,
    reviewNotes: p.reviewNotes,
    booking: {
      code: p.booking.code,
      status: p.booking.status,
      checkIn: p.booking.checkIn.toISOString().slice(0, 10),
      checkOut: p.booking.checkOut.toISOString().slice(0, 10),
      unitName: p.booking.unit.name,
      propertyName: p.booking.unit.property.name,
    },
    documents: p.documents.map((d) => ({
      id: d.id,
      kind: d.kind,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
  }));

  return <KycManager profiles={view} />;
}

