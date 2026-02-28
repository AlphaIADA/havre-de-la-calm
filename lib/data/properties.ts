import { getPrisma } from '@/lib/prisma';

export async function listProperties() {
  const prisma = getPrisma();
  const properties = await prisma.property.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  });
  return properties;
}

export async function getPropertyBySlug(slug: string) {
  const prisma = getPrisma();
  const property = await prisma.property.findUnique({
    where: { slug },
  });
  return property;
}

export async function listUnitsForProperty(propertyId: string) {
  const prisma = getPrisma();
  const units = await prisma.unit.findMany({
    where: { propertyId, active: true },
    orderBy: { createdAt: 'desc' },
  });
  return units;
}

export async function getUnitBySlug(slug: string) {
  const prisma = getPrisma();
  const unit = await prisma.unit.findUnique({
    where: { slug },
    include: { property: true },
  });
  return unit;
}

export function jsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x) => typeof x === 'string') as string[];
}
