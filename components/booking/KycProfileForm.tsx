'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';

type Props = {
  bookingCode: string;
  initial: {
    address?: string | null;
    nationality?: string | null;
    nextOfKinName?: string | null;
    nextOfKinPhone?: string | null;
    emergencyName?: string | null;
    emergencyPhone?: string | null;
    signatureText?: string | null;
    termsAcceptedAt?: string | null;
  };
};

export function KycProfileForm({ bookingCode, initial }: Props) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [address, setAddress] = React.useState(initial.address ?? '');
  const [nationality, setNationality] = React.useState(initial.nationality ?? '');
  const [nextOfKinName, setNextOfKinName] = React.useState(initial.nextOfKinName ?? '');
  const [nextOfKinPhone, setNextOfKinPhone] = React.useState(initial.nextOfKinPhone ?? '');
  const [emergencyName, setEmergencyName] = React.useState(initial.emergencyName ?? '');
  const [emergencyPhone, setEmergencyPhone] = React.useState(initial.emergencyPhone ?? '');
  const [signatureText, setSignatureText] = React.useState(initial.signatureText ?? '');
  const [termsAccepted, setTermsAccepted] = React.useState(Boolean(initial.termsAcceptedAt));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/booking/${bookingCode}/kyc/profile`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            address: address || null,
            nationality: nationality || null,
            nextOfKinName: nextOfKinName || null,
            nextOfKinPhone: nextOfKinPhone || null,
            emergencyName: emergencyName || null,
            emergencyPhone: emergencyPhone || null,
            termsAccepted,
            signatureText: signatureText || null,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Update failed');
        }
        toast.success('KYC details saved');
        router.refresh();
      } catch (err) {
        toast.error('Could not save KYC details', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            placeholder="Street, city, state"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Nationality</label>
          <input
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            placeholder="e.g. Nigerian"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Next of kin (name)</label>
          <input
            value={nextOfKinName}
            onChange={(e) => setNextOfKinName(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Next of kin (phone)</label>
          <input
            value={nextOfKinPhone}
            onChange={(e) => setNextOfKinPhone(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Emergency contact (name)</label>
          <input
            value={emergencyName}
            onChange={(e) => setEmergencyName(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Emergency contact (phone)</label>
          <input
            value={emergencyPhone}
            onChange={(e) => setEmergencyPhone(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-start gap-3">
          <input
            id="terms"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <label htmlFor="terms" className="text-sm text-zinc-700">
            I confirm the information is accurate and I accept the stay rules and terms.
          </label>
        </div>

        <div className="mt-4 space-y-2">
          <label className="text-sm font-medium">Signature</label>
          <input
            value={signatureText}
            onChange={(e) => setSignatureText(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
            placeholder="Type your full name"
          />
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Save KYC details'}
      </Button>
    </form>
  );
}

