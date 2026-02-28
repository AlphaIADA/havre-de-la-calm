import Link from 'next/link';

export default function CheckinStartPage() {
  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-base font-semibold">Start check-in</h2>
      <p className="text-sm text-white/70">
        This subsite creates a booking record with <span className="font-semibold">source=OFFLINE</span>{' '}
        and captures guest details, signatures, and private KYC uploads.
      </p>
      <Link
        href="/checkin/new"
        className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white/90"
      >
        New check-in
      </Link>
    </div>
  );
}
