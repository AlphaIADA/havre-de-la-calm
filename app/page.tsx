import Image from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck,
  CalendarCheck,
  Clock,
  CreditCard,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi,
  Zap,
} from 'lucide-react';

import GoogleReviews from '@/components/GoogleReviews';
import { BookingLookupForm } from '@/components/booking/BookingLookupForm';
import { HomeStayFinder, type HomeStayFinderUnit } from '@/components/home/HomeStayFinder';
import { Button } from '@/components/ui/Button';
import { demoBlogPosts } from '@/lib/demoBlog';
import { demoProperties, demoUnits } from '@/lib/demoData';
import { jsonStringArray } from '@/lib/data/properties';
import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type FeaturedProperty = {
  slug: string;
  name: string;
  location: string;
  description: string;
  heroImage: string;
  gallery: string[];
};

type BlogPreview = {
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
};

function uniqueList(items: string[]) {
  const out: string[] = [];
  for (const src of items) {
    if (!src) continue;
    if (!out.includes(src)) out.push(src);
  }
  return out;
}

export default async function HomePage() {
  const dbEnabled = isDbConfigured();
  let finderUnits: HomeStayFinderUnit[] = [];
  let featuredProps: FeaturedProperty[] = [];
  let blogPosts: BlogPreview[] = [];

  if (!dbEnabled) {
    const propertyMap = new Map(demoProperties.map((p) => [p.slug, p]));
    finderUnits = demoUnits.map((u) => {
      const p = propertyMap.get(u.propertySlug);
      return {
        slug: u.slug,
        name: u.name,
        maxGuests: u.maxGuests,
        minNights: u.minNights,
        baseNightly: u.baseNightly,
        weekendNightly: u.weekendNightly,
        cleaningFee: u.cleaningFee,
        depositFee: u.depositFee,
        images: u.images,
        property: {
          slug: u.propertySlug,
          name: p?.name ?? 'OTA Apartments',
          location: p?.location ?? 'Ota, Ogun State',
        },
      };
    });

    featuredProps = demoProperties.map((p) => ({
      slug: p.slug,
      name: p.name,
      location: p.location,
      description: p.description,
      heroImage: p.heroImage,
      gallery: p.gallery,
    }));

    blogPosts = demoBlogPosts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      coverImage: p.coverImage,
      publishedAt: p.publishedAt,
    }));
  } else {
    const prisma = getPrisma();
    const [properties, units, posts] = await Promise.all([
      prisma.property.findMany({
        where: { active: true },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          slug: true,
          name: true,
          location: true,
          description: true,
          heroImage: true,
          gallery: true,
        },
      }),
      prisma.unit.findMany({
        where: { active: true, property: { active: true } },
        orderBy: { createdAt: 'desc' },
        take: 24,
        select: {
          slug: true,
          name: true,
          maxGuests: true,
          minNights: true,
          baseNightly: true,
          weekendNightly: true,
          cleaningFee: true,
          depositFee: true,
          images: true,
          property: { select: { slug: true, name: true, location: true } },
        },
      }),
      prisma.blogPost.findMany({
        where: { status: 'PUBLISHED' },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 3,
        select: {
          slug: true,
          title: true,
          excerpt: true,
          ogImage: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
    ]);

    featuredProps = properties.map((p) => {
      const gallery = jsonStringArray(p.gallery);
      const hero = p.heroImage ?? gallery[0] ?? '/images/bg_1.jpg';
      return {
        slug: p.slug,
        name: p.name,
        location: p.location,
        description: p.description,
        heroImage: hero,
        gallery,
      };
    });

    finderUnits = units.map((u) => ({
      slug: u.slug,
      name: u.name,
      maxGuests: u.maxGuests,
      minNights: u.minNights,
      baseNightly: u.baseNightly,
      weekendNightly: u.weekendNightly ?? null,
      cleaningFee: u.cleaningFee,
      depositFee: u.depositFee,
      images: jsonStringArray(u.images),
      property: {
        slug: u.property.slug,
        name: u.property.name,
        location: u.property.location,
      },
    }));

    blogPosts = posts.map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt ?? '',
      coverImage: p.ogImage ?? '/images/bg_1.jpg',
      publishedAt: (p.publishedAt ?? p.createdAt).toISOString().slice(0, 10),
    }));
  }

  const featured = featuredProps.slice(0, 2).map((p) => {
    const images = uniqueList([p.heroImage, ...p.gallery]);
    const hero = images[0] ?? '/images/bg_1.jpg';
    return {
      slug: p.slug,
      name: p.name,
      location: p.location,
      description: p.description,
      image: hero,
      thumb1: images[1] ?? hero,
      thumb2: images[2] ?? hero,
    };
  });

  const posts = blogPosts.slice(0, 3);
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/havre bg.jpg"
            alt="OTA Apartments"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/55 to-white" />
        </div>

        <div className="container-px relative py-20 md:py-28">
          <div className="max-w-2xl text-white">
            <p className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
              Short-stay • Multi-property • Pay now or pay later
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-5xl">
              Premium serviced apartments for business and relaxation.
            </h1>
            <p className="mt-4 text-base text-white/85 md:text-lg">
              Find a stay in Ota & Sango-Ota. Transparent pricing, fast confirmation, and secure KYC
              review for everyone’s safety.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/properties">
                <Button className="bg-white text-zinc-950 hover:bg-white/90">Browse stays</Button>
              </Link>
              <a href="#find-stay">
                <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/15">
                  Find a stay
                </Button>
              </a>
              <Link href="/contact">
                <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/15">
                  Talk to us
                </Button>
              </Link>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/75">
              <a href="#my-booking" className="underline underline-offset-4 hover:text-white">
                Already booked? Find your booking
              </a>
              <a href="#find-stay" className="underline underline-offset-4 hover:text-white">
                Want to filter fast? Jump to search
              </a>
            </div>

            <div className="mt-10 grid gap-3 text-sm text-white/85 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="font-semibold text-white">Verified stays</div>
                <div className="mt-1">Secure locations and clear rules.</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="font-semibold text-white">Pay now or later</div>
                <div className="mt-1">Flexible payments, admin confirmation.</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="font-semibold text-white">Transparent pricing</div>
                <div className="mt-1">Nightly, fees, discounts.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="find-stay" className="container-px relative z-10 -mt-10 pb-14">
        <HomeStayFinder units={finderUnits} />
      </section>

      <section className="border-b border-zinc-200/70 bg-white">
        <div className="container-px grid gap-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Best for teams', body: 'Units sized for solo, couples, and families.', icon: Users },
            { title: 'Fast confirmation', body: 'Pay later or pay now (if enabled) + KYC review.', icon: Clock },
            { title: 'Secure check‑in', body: 'KYC-backed stays for safety and compliance.', icon: ShieldCheck },
            { title: 'Transparent fees', body: 'Nightly prices, booking fee, deposit, discounts.', icon: BadgeCheck },
          ].map((x) => (
            <div key={x.title} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <x.icon className="h-4 w-4 text-zinc-900" />
                {x.title}
              </div>
              <div className="mt-2 text-sm text-zinc-600">{x.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-px py-14">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Featured properties</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Explore our most requested stays—then book in minutes.
            </p>
          </div>
          <Link href="/properties" className="text-sm font-medium text-zinc-900 hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {featured.map((p) => (
            <Link
              key={p.slug}
              href={`/properties/${p.slug}`}
              className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
            >
              <div className="grid gap-2 p-2 sm:grid-cols-3">
                <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 sm:col-span-2">
                  <Image src={p.image} alt={p.name} fill className="object-cover transition group-hover:scale-[1.02]" />
                </div>
                <div className="grid gap-2">
                  {[p.thumb1, p.thumb2].map((src) => (
                    <div
                      key={src}
                      className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
                    >
                      <Image src={src} alt={p.name} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold">{p.name}</div>
                    <div className="mt-1 text-sm text-zinc-600">{p.location}</div>
                    <p className="mt-2 text-sm text-zinc-700">{p.description}</p>
                  </div>
                  <div className="text-sm font-medium text-zinc-900">View</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-zinc-200/70 bg-zinc-50">
        <div className="container-px py-14">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">What’s included</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Comfort-first stays with the essentials you need for work and rest.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  { title: 'Wi‑Fi', body: 'Stay connected for work and streaming.', icon: Wifi },
                  { title: 'Power support', body: 'Designed for reliable comfort.', icon: Zap },
                  { title: 'Security', body: 'Safe locations with clear check‑in rules.', icon: ShieldCheck },
                  { title: 'Flexible payments', body: 'Pay later or pay now if enabled.', icon: CreditCard },
                  { title: 'Fast check‑in', body: 'Online booking or offline host flow.', icon: CalendarCheck },
                  { title: 'Clean spaces', body: 'Consistent housekeeping standards.', icon: Sparkles },
                ].map((x) => (
                  <div key={x.title} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <x.icon className="h-4 w-4 text-zinc-900" />
                      {x.title}
                    </div>
                    <div className="mt-2 text-sm text-zinc-600">{x.body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                href="/ota"
                className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/3]">
                  <Image src="/images/havre front.jpg" alt="Ota" fill className="object-cover transition group-hover:scale-[1.02]" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4" /> Ota
                  </div>
                  <div className="mt-2 text-sm text-zinc-600">Local tips, landmarks, and what to expect.</div>
                </div>
              </Link>
              <Link
                href="/sango-ota"
                className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[4/3]">
                  <Image src="/images/havre deluxe.jpg" alt="Sango-Ota" fill className="object-cover transition group-hover:scale-[1.02]" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="h-4 w-4" /> Sango‑Ota
                  </div>
                  <div className="mt-2 text-sm text-zinc-600">Explore popular areas and booking guidance.</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-px py-14">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">How it works</h2>
            <p className="mt-2 text-sm text-zinc-600">
              A simple flow built for speed—online or offline.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { title: 'Pick a stay', body: 'View photos, amenities, and rules.', icon: Search },
              { title: 'Select dates', body: 'See pricing + fees before you confirm.', icon: CalendarCheck },
              { title: 'Confirm & check‑in', body: 'Submit KYC. Pay later or now if enabled.', icon: ShieldCheck },
            ].map((x) => (
              <div key={x.title} className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                <x.icon className="h-4 w-4 text-zinc-900" />
                <div className="mt-3 text-sm font-semibold">{x.title}</div>
                <div className="mt-1 text-sm text-zinc-600">{x.body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200/70 bg-zinc-50">
        <div className="container-px py-14">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Offline check-in for hosts</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Managing walk-ins or phone bookings? Use our dedicated check-in subsite to capture
                guest details, IDs, and signatures—fast.
              </p>
              <p className="mt-4 text-sm text-zinc-600">
                Open <span className="font-medium">checkin.otaapartments.com</span> on any device.
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
              <div className="text-sm font-semibold">Need help?</div>
              <p className="mt-2 text-sm text-zinc-600">
                Use the chat button to send a message, or contact support for urgent requests.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/contact">
                  <Button variant="secondary">Contact</Button>
                </Link>
                <a href="https://wa.me/2348169267198" target="_blank" rel="noreferrer">
                  <Button>WhatsApp</Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="my-booking" className="container-px py-14">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Find your booking</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Enter your booking code to open the guest portal (status, messages, and KYC uploads).
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <BookingLookupForm />
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200/70 bg-white">
        <div className="container-px py-14">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">From the blog</h2>
              <p className="mt-1 text-sm text-zinc-600">Tips, updates, and booking guidance.</p>
            </div>
            <Link href="/blog" className="text-sm font-medium text-zinc-900 hover:underline">
              View all
            </Link>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="relative aspect-[16/10]">
                  <Image src={post.coverImage} alt={post.title} fill className="object-cover transition group-hover:scale-[1.02]" />
                </div>
                <div className="p-5">
                  <div className="text-xs text-zinc-500">{post.publishedAt}</div>
                  <div className="mt-2 text-base font-semibold">{post.title}</div>
                  <p className="mt-2 text-sm text-zinc-700">{post.excerpt}</p>
                  <div className="mt-4 text-sm font-medium text-zinc-900">Read →</div>
                </div>
              </Link>
            ))}
            {!posts.length ? (
              <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600 md:col-span-3">
                No posts yet. Check back soon.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200/70 bg-zinc-50">
        <div className="container-px py-14">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">FAQs</h2>
              <p className="mt-2 text-sm text-zinc-600">Quick answers before you book.</p>
            </div>
            <div className="space-y-3">
              {[
                {
                  q: 'Can I pay later?',
                  a: 'Yes. “Pay later” bookings are received and remain pending until an admin confirms availability and completes KYC review.',
                },
                {
                  q: 'Why is KYC required?',
                  a: 'KYC helps keep guests and properties safe. It’s required before confirmation and is reviewed by ADMIN/STAFF only.',
                },
                {
                  q: 'What fees should I expect?',
                  a: 'Totals may include nightly charges, a booking fee, and a refundable deposit (if applicable). Promo codes can reduce the nightly total.',
                },
                {
                  q: 'Can I change dates after booking?',
                  a: 'Usually, yes—subject to availability. Message us from your booking portal and an admin will help.',
                },
                {
                  q: 'Do you support offline check-in?',
                  a: 'Yes. Hosts can create walk‑in bookings using our check‑in subsite. Guests can still use the booking portal after.',
                },
              ].map((item) => (
                <details key={item.q} className="group rounded-3xl border border-zinc-200 bg-white p-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold">
                    {item.q}
                    <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 group-open:hidden">
                      +
                    </span>
                    <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600 hidden group-open:inline">
                      −
                    </span>
                  </summary>
                  <div className="mt-3 text-sm text-zinc-600">{item.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200/70 bg-white py-16">
        <div className="container-px">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Guest Reviews</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Reviews are loaded from Google via Elfsight.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { title: 'Clean rooms', body: 'A consistent comfort standard.' },
                { title: 'Fast support', body: 'Message us and get help quickly.' },
                { title: 'Easy booking', body: 'Clear pricing and a smooth flow.' },
              ].map((x) => (
                <div key={x.title} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
                  <div className="text-sm font-semibold">{x.title}</div>
                  <div className="mt-1 text-sm text-zinc-600">{x.body}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
              <GoogleReviews />
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200/70 bg-zinc-950">
        <div className="container-px py-14">
          <div className="grid gap-6 rounded-3xl bg-white/5 p-8 text-white ring-1 ring-white/10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">Ready to book?</h2>
              <p className="mt-2 text-sm text-white/75">
                Browse properties, pick dates, and confirm with secure KYC—pay now or later.
              </p>
            </div>
            <div className="flex flex-wrap justify-start gap-3 md:justify-end">
              <Link href="/properties">
                <Button className="bg-white text-zinc-950 hover:bg-white/90">Browse stays</Button>
              </Link>
              <Link href="/contact">
                <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/15">
                  Contact support
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
