import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function main() {
  const adminEmail = requireEnv('ADMIN_EMAIL');
  const adminPassword = requireEnv('ADMIN_PASSWORD');

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash, role: UserRole.ADMIN },
    create: { email: adminEmail, passwordHash, role: UserRole.ADMIN, name: 'Admin' },
  });

  const p1 = await prisma.property.upsert({
    where: { slug: 'havre-de-la-calme-ota' },
    update: {},
    create: {
      slug: 'havre-de-la-calme-ota',
      name: 'Havre De La Calme',
      location: 'Ota, Ogun State',
      description:
        'A serene short-stay serviced apartment experience with modern interiors, reliable utilities, and quick access to key areas in Ota.',
      heroImage: '/images/havre outside view.jpg',
      gallery: ['/images/Havre 1.jpg', '/images/Havre Suite.jpg', '/images/Havre Bath Tub.jpg'],
      amenities: ['Wi‑Fi', 'Air conditioning', 'Smart TV', '24/7 security'],
    },
  });

  const p2 = await prisma.property.upsert({
    where: { slug: 'ota-premium-suites' },
    update: {},
    create: {
      slug: 'ota-premium-suites',
      name: 'OTA Premium Suites',
      location: 'Sango-Ota, Ogun State',
      description:
        'Premium suites designed for business trips and weekend resets—comfort-first bedding, great lighting, and simple check-in.',
      heroImage: '/images/havre deluxe.jpg',
      gallery: ['/images/SUITE.jpg', '/images/havre family.jpg', '/images/havre standard.jpg'],
      amenities: ['Wi‑Fi', 'Air conditioning', 'Parking', '24/7 security'],
    },
  });

  await prisma.unit.upsert({
    where: { slug: 'havre-standard-room' },
    update: {},
    create: {
      slug: 'havre-standard-room',
      propertyId: p1.id,
      name: 'Standard Room',
      summary: 'Affordable and comfortable for solo travelers or short business visits.',
      maxGuests: 2,
      minNights: 1,
      baseNightly: 25000,
      weekendNightly: 30000,
      cleaningFee: 5000,
      depositFee: 10000,
      images: ['/images/Standard Room.jpg', '/images/havre standard.jpg', '/images/Havre toilet.jpg'],
      amenities: ['Wi‑Fi', 'Air conditioning', 'Smart TV', '24/7 security'],
      rules: ['No smoking indoors', 'No loud parties', 'Valid ID required for check‑in'],
    },
  });

  await prisma.unit.upsert({
    where: { slug: 'havre-suite' },
    update: {},
    create: {
      slug: 'havre-suite',
      propertyId: p1.id,
      name: 'Suite',
      summary: 'More space, better views, and a premium feel for longer stays.',
      maxGuests: 3,
      minNights: 1,
      baseNightly: 35000,
      weekendNightly: 40000,
      cleaningFee: 7000,
      depositFee: 15000,
      images: ['/images/Havre Suite.jpg', '/images/SUITE.jpg', '/images/Havre Bath Tub.jpg'],
      amenities: ['Wi‑Fi', 'Air conditioning', 'Kitchenette', 'Smart TV', 'Hot water'],
      rules: ['No smoking indoors', 'Keep noise low after 10pm', 'Valid ID required for check‑in'],
    },
  });

  await prisma.unit.upsert({
    where: { slug: 'havre-family-room' },
    update: {},
    create: {
      slug: 'havre-family-room',
      propertyId: p2.id,
      name: 'Family Room',
      summary: 'Ideal for families—extra sleeping space with practical amenities.',
      maxGuests: 5,
      minNights: 2,
      baseNightly: 45000,
      weekendNightly: 55000,
      cleaningFee: 9000,
      depositFee: 20000,
      images: ['/images/Family room.jpg', '/images/havre family.jpg', '/images/havre amen.jpg'],
      amenities: ['Wi‑Fi', 'Air conditioning', 'Full kitchen', 'Parking', '24/7 security'],
      rules: ['No smoking indoors', 'No parties', 'Valid ID required for check‑in'],
    },
  });

  await prisma.blogCategory.upsert({
    where: { slug: 'guides' },
    update: {},
    create: { slug: 'guides', name: 'Guides' },
  });

  await prisma.blogPost.upsert({
    where: { slug: 'pay-now-vs-pay-later' },
    update: {},
    create: {
      slug: 'pay-now-vs-pay-later',
      title: 'Pay Now vs Pay Later: what to expect',
      excerpt: 'We support flexible payment. Here’s how confirmation works and when KYC is required.',
      content:
        '## Pay later\\n\\nYour booking is received and stays pending until admin confirms.\\n\\n## Pay now\\n\\nIf Paystack is enabled, you can pay immediately and receive quicker confirmation (after KYC review).',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      createdById: admin.id,
      seoTitle: 'Pay Now vs Pay Later — OTA Apartments',
      seoDescription: 'Learn how booking confirmation works with pay later or Paystack pay now.',
      ogImage: '/images/bg_2.jpg',
    },
  });

  console.log(`Seed complete. Admin: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

