export type DemoProperty = {
  slug: string;
  name: string;
  location: string;
  description: string;
  heroImage: string;
  gallery: string[];
};

export type DemoUnit = {
  slug: string;
  propertySlug: string;
  name: string;
  summary: string;
  maxGuests: number;
  minNights: number;
  baseNightly: number;
  weekendNightly: number | null;
  cleaningFee: number;
  depositFee: number;
  images: string[];
  amenities: string[];
  rules: string[];
};

export const demoProperties: DemoProperty[] = [
  {
    slug: 'havre-de-la-calme-ota',
    name: 'Havre De La Calme',
    location: 'Ota, Ogun State',
    description:
      'A serene short-stay serviced apartment experience with modern interiors, reliable utilities, and quick access to key areas in Ota.',
    heroImage: '/images/havre outside view.jpg',
    gallery: ['/images/Havre 1.jpg', '/images/Havre Suite.jpg', '/images/Havre Bath Tub.jpg'],
  },
  {
    slug: 'ota-premium-suites',
    name: 'OTA Premium Suites',
    location: 'Sango-Ota, Ogun State',
    description:
      'Premium suites designed for business trips and weekend resets—comfort-first bedding, great lighting, and simple check-in.',
    heroImage: '/images/havre deluxe.jpg',
    gallery: ['/images/SUITE.jpg', '/images/havre family.jpg', '/images/havre standard.jpg'],
  },
];

export const demoUnits: DemoUnit[] = [
  {
    slug: 'havre-standard-room',
    propertySlug: 'havre-de-la-calme-ota',
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
  {
    slug: 'havre-suite',
    propertySlug: 'havre-de-la-calme-ota',
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
  {
    slug: 'havre-family-room',
    propertySlug: 'ota-premium-suites',
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
];

export function getDemoPropertyBySlug(slug: string) {
  return demoProperties.find((p) => p.slug === slug) ?? null;
}

export function getDemoUnitsForProperty(propertySlug: string) {
  return demoUnits.filter((u) => u.propertySlug === propertySlug);
}

export function getDemoUnitBySlug(slug: string) {
  return demoUnits.find((u) => u.slug === slug) ?? null;
}

