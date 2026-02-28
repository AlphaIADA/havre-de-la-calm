import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BookingEditor } from '@/components/admin/BookingEditor';
import { formatDateOnly } from '@/lib/dateOnly';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Edit booking' };
export const dynamic = 'force-dynamic';

export default async function AdminBookingEditPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  const prisma = getPrisma();
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      unit: { include: { property: true } },
      promoCode: { select: { code: true } },
      payments: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });

  if (!booking) return notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/bookings" className="text-sm font-medium text-zinc-900 hover:underline">
        ← Back to bookings
      </Link>
      <BookingEditor
        booking={{
          id: booking.id,
          code: booking.code,
          status: booking.status,
          payMode: booking.payMode,
          guestName: booking.guestName,
          guestEmail: booking.guestEmail,
          guestPhone: booking.guestPhone,
          propertyName: booking.unit.property.name,
          unitName: booking.unit.name,
          checkIn: formatDateOnly(booking.checkIn),
          checkOut: formatDateOnly(booking.checkOut),
          adults: booking.adults,
          children: booking.children,
          nightlyTotal: booking.nightlyTotal,
          cleaningFee: booking.cleaningFee,
          depositFee: booking.depositFee,
          discountAmount: booking.discountAmount,
          totalAmount: booking.totalAmount,
          promoCode: booking.promoCode?.code ?? null,
          notes: booking.notes ?? '',
          createdAt: booking.createdAt.toISOString(),
          updatedAt: booking.updatedAt.toISOString(),
          payments: booking.payments.map((p) => ({
            id: p.id,
            provider: p.provider,
            status: p.status,
            amount: p.amount,
            reference: p.reference,
            createdAt: p.createdAt.toISOString(),
          })),
        }}
      />
    </div>
  );
}

