'use client';

import * as React from 'react';
import { toast } from 'sonner';

type Property = { slug: string; name: string; location: string };
type Unit = { slug: string; propertySlug: string; name: string; maxGuests: number };

export function OfflineCheckinForm({ properties, units }: { properties: Property[]; units: Unit[] }) {
  const [propertySlug, setPropertySlug] = React.useState(properties[0]?.slug ?? '');
  const propertyUnits = units.filter((u) => u.propertySlug === propertySlug);
  const [unitSlug, setUnitSlug] = React.useState(propertyUnits[0]?.slug ?? '');
  const [pending, startTransition] = React.useTransition();
  const mainBaseUrl = React.useMemo(() => {
    const env = (process.env.NEXT_PUBLIC_APP_URL ?? '').trim();
    if (env) return env.replace(/\/$/, '');
    if (typeof window !== 'undefined') {
      const host = window.location.host.replace(/^checkin\./i, '');
      return `${window.location.protocol}//${host}`;
    }
    const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? '').trim();
    return rootDomain ? `https://${rootDomain}` : '';
  }, []);

  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [adults, setAdults] = React.useState(1);
  const [children, setChildren] = React.useState(0);

  const [guestName, setGuestName] = React.useState('');
  const [guestEmail, setGuestEmail] = React.useState('');
  const [guestPhone, setGuestPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [nationality, setNationality] = React.useState('');
  const [nextOfKinName, setNextOfKinName] = React.useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = React.useState('');
  const [emergencyName, setEmergencyName] = React.useState('');
  const [emergencyPhone, setEmergencyPhone] = React.useState('');
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [signatureText, setSignatureText] = React.useState('');

  const [idFront, setIdFront] = React.useState<File | null>(null);
  const [selfie, setSelfie] = React.useState<File | null>(null);
  const [proofOfAddress, setProofOfAddress] = React.useState<File | null>(null);

  const [createdCode, setCreatedCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    setUnitSlug(propertyUnits[0]?.slug ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertySlug]);

  const uploadDoc = async (bookingCode: string, kind: string, file: File) => {
    const form = new FormData();
    form.set('kind', kind);
    form.set('file', file);
    const res = await fetch(`/api/booking/${bookingCode}/kyc/upload`, { method: 'POST', body: form });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error ?? 'Upload failed');
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error('Terms must be accepted');
      return;
    }
    if (!signatureText.trim()) {
      toast.error('Signature is required');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/checkin/offline', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            propertySlug,
            unitSlug,
            checkIn,
            checkOut,
            adults,
            children,
            guestName,
            guestEmail: guestEmail || null,
            guestPhone,
            address: address || null,
            nationality: nationality || null,
            nextOfKinName: nextOfKinName || null,
            nextOfKinPhone: nextOfKinPhone || null,
            emergencyName: emergencyName || null,
            emergencyPhone: emergencyPhone || null,
            termsAccepted,
            signatureText,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body?.error ?? 'Could not create booking');
        }

        const bookingCode = body.bookingCode as string;
        setCreatedCode(bookingCode);

        const uploads: Array<{ kind: string; file: File | null }> = [
          { kind: 'ID_FRONT', file: idFront },
          { kind: 'SELFIE', file: selfie },
          { kind: 'PROOF_OF_ADDRESS', file: proofOfAddress },
        ];
        for (const u of uploads) {
          if (u.file) await uploadDoc(bookingCode, u.kind, u.file);
        }

        toast.success('Offline booking created', {
          description: `Booking code: ${bookingCode}`,
        });
      } catch (err) {
        toast.error('Offline check-in failed', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-base font-semibold">New offline booking</h2>

      {createdCode ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
          Created booking code: <span className="font-mono font-semibold text-white">{createdCode}</span>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={`${mainBaseUrl}/booking/${createdCode}`}
              className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-white/90"
              target="_blank"
              rel="noreferrer"
            >
              Open guest portal
            </a>
            <a
              href={`${mainBaseUrl}/admin/bookings`}
              className="rounded-2xl border border-white/15 bg-transparent px-3 py-2 text-xs font-semibold text-white hover:bg-white/10"
              target="_blank"
              rel="noreferrer"
            >
              Admin bookings
            </a>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Property</label>
        <select
          value={propertySlug}
          onChange={(e) => setPropertySlug(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
        >
          {properties.map((p) => (
            <option key={p.slug} value={p.slug}>
              {p.name} — {p.location}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Unit</label>
        <select
          value={unitSlug}
          onChange={(e) => setUnitSlug(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
        >
          {propertyUnits.map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.name} (max {u.maxGuests})
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Check-in</label>
          <input
            type="date"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Check-out</label>
          <input
            type="date"
            required
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Adults</label>
          <input
            type="number"
            min={1}
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value))}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Children</label>
          <input
            type="number"
            min={0}
            value={children}
            onChange={(e) => setChildren(Number(e.target.value))}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Guest full name</label>
          <input
            required
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Phone</label>
          <input
            required
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Email (optional)</label>
        <input
          type="email"
          value={guestEmail}
          onChange={(e) => setGuestEmail(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          placeholder="Street, city, state"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Next of kin name</label>
          <input
            value={nextOfKinName}
            onChange={(e) => setNextOfKinName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Next of kin phone</label>
          <input
            value={nextOfKinPhone}
            onChange={(e) => setNextOfKinPhone(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Emergency contact name</label>
          <input
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/80">Emergency contact phone</label>
          <input
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Nationality (optional)</label>
        <input
          value={nationality}
          onChange={(e) => setNationality(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      <div className="space-y-3 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="text-sm font-semibold">ID document uploads</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">ID front</label>
            <input
              type="file"
              onChange={(e) => setIdFront(e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Selfie</label>
            <input
              type="file"
              onChange={(e) => setSelfie(e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium text-white/80">Proof of address (optional)</label>
            <input
              type="file"
              onChange={(e) => setProofOfAddress(e.target.files?.[0] ?? null)}
              className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white"
            />
          </div>
        </div>
        <div className="text-xs text-white/60">
          Uploads require Cloudinary configuration. Documents remain private for ADMIN/STAFF review.
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <label htmlFor="terms" className="text-sm text-white/80">
            I accept the stay terms and confirm the information is accurate.
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-white/80">Signature (type full name)</label>
        <input
          required
          value={signatureText}
          onChange={(e) => setSignatureText(e.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white/90 disabled:opacity-70"
      >
        {pending ? 'Submitting…' : 'Submit offline check-in'}
      </button>

      <div className="text-xs text-white/50">
        Selected: <span className="text-white/70">{propertySlug}</span> /{' '}
        <span className="text-white/70">{unitSlug}</span>
      </div>
    </form>
  );
}
