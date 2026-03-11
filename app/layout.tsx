import type { Metadata } from 'next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { headers } from 'next/headers';

import '@/app/globals.css';

import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { ChatWidget } from '@/components/site/ChatWidget';
import { AppToaster } from '@/components/ui/Toaster';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  title: {
    default: 'OTA Apartments — Short-stay serviced apartments in Ota',
    template: '%s — OTA Apartments',
  },
  description:
    'Book premium short-stay serviced apartments in Ota & Sango-Ota. Flexible pay now or pay later, and fast offline check-in.',
  openGraph: {
    type: 'website',
    siteName: 'OTA Apartments',
    title: 'OTA Apartments — Short-stay serviced apartments in Ota',
    description:
      'Book premium short-stay serviced apartments in Ota & Sango-Ota. Flexible pay now or pay later, and fast offline check-in.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get('host') ?? '';
  const isCheckinHost = host.toLowerCase().startsWith('checkin.');

  return (
    <html lang="en">
      <body>
        {isCheckinHost ? (
          <main className="min-h-dvh">{children}</main>
        ) : (
          <div className="min-h-dvh">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
            <ChatWidget />
          </div>
        )}
        <AppToaster />
        <SpeedInsights />
      </body>
    </html>
  );
}
