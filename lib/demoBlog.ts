export type DemoBlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string; // YYYY-MM-DD
  content: string;
};

export const demoBlogPosts: DemoBlogPost[] = [
  {
    slug: 'best-short-stay-ota',
    title: 'How to choose the best short-stay in Ota',
    excerpt:
      'A quick checklist for comfort, safety, power backup, and what to ask before you book.',
    coverImage: '/images/bg_1.jpg',
    publishedAt: '2026-02-01',
    content: `## What matters most\n\n- Location and security\n- Cleanliness standards\n- Transparent pricing\n- House rules\n\nBook early on weekends for best availability.`,
  },
  {
    slug: 'pay-now-vs-pay-later',
    title: 'Pay Now vs Pay Later: what to expect',
    excerpt:
      'We support flexible payment. Here’s how confirmation works and when KYC is required.',
    coverImage: '/images/bg_2.jpg',
    publishedAt: '2026-02-10',
    content: `## Pay later\n\nYour booking is received and stays **pending** until admin confirms.\n\n## Pay now\n\nIf Paystack is enabled, you can pay immediately and receive quicker confirmation (after KYC review).`,
  },
];

export function getDemoBlogPost(slug: string) {
  return demoBlogPosts.find((p) => p.slug === slug) ?? null;
}

