import Link from 'next/link';

import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Serviced apartments in Ota',
  description: 'Book short-stay serviced apartments in Ota, Ogun State.',
};

export default function OtaLandingPage() {
  return (
    <div className="container-px py-10">
      <div className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight">Serviced apartments in Ota</h1>
        <p className="mt-3 text-sm text-zinc-700">
          Find secure short-stay apartments in Ota, Ogun State—ideal for business trips, family
          visits, and weekend stays.
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

