import Image from 'next/image';
import Link from 'next/link';

import GoogleReviews from '@/components/GoogleReviews';
import { Button } from '@/components/ui/Button';

const featured = [
  {
    slug: 'havre-de-la-calme-ota',
    name: 'Havre De La Calme',
    location: 'Ota, Ogun State',
    image: '/images/havre front.jpg',
  },
  {
    slug: 'ota-premium-suites',
    name: 'OTA Premium Suites',
    location: 'Sango-Ota, Ogun State',
    image: '/images/havre deluxe.jpg',
  },
];

export default function HomePage() {
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
              <Link href="/contact">
                <Button variant="ghost" className="bg-white/10 text-white hover:bg-white/15">
                  Talk to us
                </Button>
              </Link>
            </div>

            <div className="mt-10 grid gap-3 text-sm text-white/85 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="font-semibold text-white">Trusted locations</div>
                <div className="mt-1">Secure, accessible areas.</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="font-semibold text-white">Fast check-in</div>
                <div className="mt-1">Online booking or offline flow.</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="font-semibold text-white">Transparent pricing</div>
                <div className="mt-1">Nightly, fees, discounts.</div>
              </div>
            </div>
          </div>
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
              <div className="relative aspect-[16/9]">
                <Image src={p.image} alt={p.name} fill className="object-cover transition group-hover:scale-[1.02]" />
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-base font-semibold">{p.name}</div>
                    <div className="mt-1 text-sm text-zinc-600">{p.location}</div>
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

      <section className="py-16">
        <div className="container mx-auto">
          <h2 className="mb-6 text-center text-3xl font-bold">Guest Reviews</h2>
          <GoogleReviews />
        </div>
      </section>
    </div>
  );
}
