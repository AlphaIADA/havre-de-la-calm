import { PromoCodesManager, type Promo } from '@/components/admin/PromoCodesManager';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Discounts' };
export const dynamic = 'force-dynamic';

export default async function AdminDiscountsPage() {
  const prisma = getPrisma();
  const [promoCodes, properties, units] = await Promise.all([
    prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { property: { select: { name: true } }, unit: { select: { name: true, property: { select: { name: true } }, propertyId: true } } },
    }),
    prisma.property.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true }, where: { active: true } }),
    prisma.unit.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true, propertyId: true, property: { select: { name: true } } }, where: { active: true } }),
  ]);

  const view: Promo[] = promoCodes.map((p) => ({
    id: p.id,
    code: p.code,
    type: p.type,
    amount: p.amount,
    active: p.active,
    redeemedCount: p.redeemedCount,
    maxRedemptions: p.maxRedemptions,
    expiresAt: p.expiresAt?.toISOString() ?? null,
    propertyName: p.property?.name ?? null,
    unitName: p.unit ? `${p.unit.property.name} — ${p.unit.name}` : null,
  }));

  return (
    <PromoCodesManager
      promoCodes={view}
      properties={properties}
      units={units.map((u) => ({ id: u.id, name: u.name, propertyId: u.propertyId, propertyName: u.property.name }))}
    />
  );
}
