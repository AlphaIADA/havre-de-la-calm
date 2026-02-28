import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Serviced apartments in Sango-Ota',
  description: 'Book short-stay serviced apartments in Sango-Ota, Ogun State.',
};

export default function SangoOtaLandingPage() {
  return (
    <div className="container-px py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Serviced apartments in Sango-Ota</h1>
        <p className="mt-3 text-sm text-zinc-700">
          Stay close to key roads and business areas in Sango-Ota with a comfortable short-let that
          supports pay now or pay later bookings.
        </p>
        <div className="mt-6">
          <Link href="/properties">
            <Button>Browse stays</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

