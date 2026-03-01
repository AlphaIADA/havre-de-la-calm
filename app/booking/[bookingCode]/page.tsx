import Link from 'next/link';
import { notFound } from 'next/navigation';

import { GuestMessageForm } from '@/components/booking/GuestMessageForm';
import { KycProfileForm } from '@/components/booking/KycProfileForm';
import { KycUploadForm } from '@/components/booking/KycUploadForm';
import { Button } from '@/components/ui/Button';
import { isCloudinaryConfigured } from '@/lib/cloudinary';
import { isDbConfigured } from '@/lib/env';
import { getPrisma } from '@/lib/prisma';

export const metadata = {
  title: 'Booking',
  description: 'View booking status, upload missing KYC, and message admin.',
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = 'force-dynamic';

export default async function BookingPortalPage({
  params,
}: {
  params: Promise<{ bookingCode: string }>;
}) {
  const { bookingCode } = await params;

  if (!isDbConfigured()) {
    return (
      <div className="container-px py-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">Booking portal</h1>
          <p className="mt-2 text-sm text-zinc-600">
            Booking code: <span className="font-semibold text-zinc-900">{bookingCode}</span>
          </p>
          <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700">
            Booking portal is temporarily unavailable. Please try again later or contact support.
          </div>
        </div>
      </div>
    );
  }

  const prisma = getPrisma();
  const booking = await prisma.booking.findUnique({
    where: { code: bookingCode },
    include: {
      unit: { include: { property: true } },
      kycProfile: { include: { documents: { orderBy: { createdAt: 'desc' } } } },
      promoCode: { select: { code: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  if (!booking) return notFound();

  const uploadsEnabled = isCloudinaryConfigured();
  const docs =
    booking.kycProfile?.documents.map((d) => ({
      id: d.id,
      kind: d.kind,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })) ?? [];

  return (
    <div className="container-px py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Booking portal</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Booking code: <span className="font-semibold text-zinc-900">{bookingCode}</span>
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Status</h2>
            <div className="mt-3 grid gap-2 text-sm text-zinc-700">
              <div>
                <span className="text-zinc-500">Property:</span>{' '}
                <span className="font-medium text-zinc-900">{booking.unit.property.name}</span>
              </div>
              <div>
                <span className="text-zinc-500">Unit:</span>{' '}
                <span className="font-medium text-zinc-900">{booking.unit.name}</span>
              </div>
              <div>
                <span className="text-zinc-500">Dates:</span>{' '}
                <span className="font-medium text-zinc-900">
                  {booking.checkIn.toISOString().slice(0, 10)} →{' '}
                  {booking.checkOut.toISOString().slice(0, 10)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Booking status:</span>{' '}
                <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-900">
                  {booking.status}
                </span>
              </div>
              <div>
                <span className="text-zinc-500">Payment:</span>{' '}
                <span className="font-medium text-zinc-900">{booking.payMode}</span>
              </div>
              {booking.payments[0] ? (
                <div>
                  <span className="text-zinc-500">Latest payment:</span>{' '}
                  <span className="font-medium text-zinc-900">
                    {booking.payments[0].provider} {booking.payments[0].status}
                  </span>
                </div>
              ) : null}
              <div>
                <span className="text-zinc-500">Total:</span>{' '}
                <span className="font-medium text-zinc-900">
                  ₦{booking.totalAmount.toLocaleString()}
                </span>
              </div>
              {booking.discountAmount ? (
                <div>
                  <span className="text-zinc-500">Discount:</span>{' '}
                  <span className="font-medium text-zinc-900">
                    -₦{booking.discountAmount.toLocaleString()}
                  </span>
                  {booking.promoCode?.code ? (
                    <span className="text-zinc-500"> ({booking.promoCode.code})</span>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact">
                <Button variant="secondary">Contact support</Button>
              </Link>
              <Link href="/properties">
                <Button variant="ghost">Browse more stays</Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
            <h2 className="text-base font-semibold">KYC uploads</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Upload your documents to speed up verification. Documents are private and only
              visible to ADMIN/STAFF.
            </p>
            <div className="mt-6">
              <KycUploadForm bookingCode={bookingCode} documents={docs} uploadsEnabled={uploadsEnabled} />
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">KYC details</h2>
            <p className="mt-2 text-sm text-zinc-600">
              Provide next of kin and emergency contact details. Admin uses this during verification.
            </p>
            <div className="mt-6">
              <KycProfileForm
                bookingCode={bookingCode}
                initial={{
                  address: booking.kycProfile?.address ?? null,
                  nationality: booking.kycProfile?.nationality ?? null,
                  nextOfKinName: booking.kycProfile?.nextOfKinName ?? null,
                  nextOfKinPhone: booking.kycProfile?.nextOfKinPhone ?? null,
                  emergencyName: booking.kycProfile?.emergencyName ?? null,
                  emergencyPhone: booking.kycProfile?.emergencyPhone ?? null,
                  signatureText: booking.kycProfile?.signatureText ?? null,
                  termsAcceptedAt: booking.kycProfile?.termsAcceptedAt?.toISOString() ?? null,
                }}
              />
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold">Message admin</h2>
            <p className="mt-2 text-sm text-zinc-600">Send a message about your stay or request.</p>
            <div className="mt-4">
              <GuestMessageForm bookingCode={bookingCode} guestName={booking.guestName} guestEmail={booking.guestEmail} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
