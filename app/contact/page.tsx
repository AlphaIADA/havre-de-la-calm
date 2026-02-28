import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Contact',
  description: 'Contact OTA Apartments for bookings, questions, and support.',
};

export default function ContactPage() {
  return (
    <div className="container-px py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Contact</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Need help with a booking or want to ask a question? We respond fast.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Reach us</h2>
            <div className="mt-3 space-y-1 text-sm text-zinc-700">
              <div>Phone: +234 816 926 7198</div>
              <div>Email: hdlc.bookings@gmail.com</div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href="https://wa.me/2348169267198" target="_blank" rel="noreferrer">
                <Button>WhatsApp</Button>
              </a>
              <Link href="/properties">
                <Button variant="secondary">Browse stays</Button>
              </Link>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-5">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-base font-semibold">Booking code?</h2>
            <p className="mt-2 text-sm text-zinc-600">
              If you already have a booking, open your guest portal using your code:
            </p>
            <div className="mt-4 text-sm">
              <span className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-700">
                /booking/&lt;code&gt;
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

