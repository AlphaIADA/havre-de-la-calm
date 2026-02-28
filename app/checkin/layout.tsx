export const metadata = {
  title: 'Offline check-in',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckinLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-950 text-white">
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <div className="mb-6">
          <div className="text-xs font-semibold text-white/60">OTA Apartments</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Offline check-in</h1>
          <p className="mt-2 text-sm text-white/70">
            Fast host flow for walk-ins and manual bookings. Documents are stored securely for
            ADMIN/STAFF review.
          </p>
        </div>
        {children}
        <div className="mt-10 text-xs text-white/50">
          Tip: Use <span className="font-medium text-white/70">checkin.otaapartments.com</span> on
          your phone for the best experience.
        </div>
      </div>
    </div>
  );
}

