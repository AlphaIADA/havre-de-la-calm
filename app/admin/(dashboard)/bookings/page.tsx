import { BookingsManager, type BookingRow } from '@/components/admin/BookingsManager';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Bookings' };
export const dynamic = 'force-dynamic';

export default async function AdminBookingsPage() {
  const prisma = getPrisma();
  const bookings = await prisma.booking.findMany({
    include: { unit: { include: { property: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const rows: BookingRow[] = bookings.map((b) => ({
    id: b.id,
    code: b.code,
    status: b.status,
    payMode: b.payMode,
    totalAmount: b.totalAmount,
    currency: b.currency,
    checkIn: b.checkIn.toISOString().slice(0, 10),
    checkOut: b.checkOut.toISOString().slice(0, 10),
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    unitName: b.unit.name,
    propertyName: b.unit.property.name,
  }));

  return <BookingsManager bookings={rows} />;
}
