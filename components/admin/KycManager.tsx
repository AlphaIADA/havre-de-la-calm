'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

type Doc = {
  id: string;
  kind: string;
  status: string;
  createdAt: string;
};

type Profile = {
  id: string;
  status: string;
  fullName: string;
  email: string;
  phone: string;
  address: string | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  reviewNotes: string | null;
  booking: {
    code: string;
    status: string;
    checkIn: string;
    checkOut: string;
    unitName: string;
    propertyName: string;
  };
  documents: Doc[];
};

export function KycManager({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const reviewProfile = (profileId: string, status: 'APPROVED' | 'REJECTED') => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/kyc/profiles/${profileId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Review failed');
        toast.success(`KYC ${status.toLowerCase()}`);
        router.refresh();
      } catch (err) {
        toast.error('Could not review KYC', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const reviewDoc = (docId: string, status: 'APPROVED' | 'REJECTED') => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/kyc/documents/${docId}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Update failed');
        toast.success(`Document ${status.toLowerCase()}`);
        router.refresh();
      } catch (err) {
        toast.error('Could not update document', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const viewDoc = (docId: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/kyc/documents/${docId}/url`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Could not generate URL');
        }
        const body = await res.json();
        window.open(body.url, '_blank', 'noopener,noreferrer');
      } catch (err) {
        toast.error('Could not open document', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">KYC review center</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Documents are private. Only ADMIN/STAFF can generate short-lived signed URLs to view.
        </p>
      </div>

      <div className="grid gap-4">
        {profiles.map((p) => (
          <div key={p.id} className="rounded-3xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-semibold">
                  {p.fullName}{' '}
                  <span className="ml-2 rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-900">
                    {p.status}
                  </span>
                </div>
                <div className="text-xs text-zinc-500">
                  {p.email} • {p.phone}
                </div>
                <div className="text-xs text-zinc-500">
                  Booking <span className="font-mono">{p.booking.code}</span> • {p.booking.propertyName} /{' '}
                  {p.booking.unitName}
                </div>
                <div className="text-xs text-zinc-500">
                  {p.booking.checkIn} → {p.booking.checkOut} • Booking status: {p.booking.status}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 px-3 py-1 text-xs"
                  onClick={() => reviewProfile(p.id, 'APPROVED')}
                  disabled={pending}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-8 px-3 py-1 text-xs"
                  onClick={() => reviewProfile(p.id, 'REJECTED')}
                  disabled={pending}
                >
                  Reject
                </Button>
                <a
                  className="inline-flex h-8 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                  href={`/booking/${p.booking.code}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Guest portal
                </a>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700">
                <div className="font-semibold">Next of kin</div>
                <div className="mt-1">{p.nextOfKinName ?? '—'}</div>
                <div className="text-zinc-500">{p.nextOfKinPhone ?? ''}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700">
                <div className="font-semibold">Emergency contact</div>
                <div className="mt-1">{p.emergencyName ?? '—'}</div>
                <div className="text-zinc-500">{p.emergencyPhone ?? ''}</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4">
              <div className="text-sm font-semibold">Documents</div>
              {p.documents.length ? (
                <ul className="mt-3 space-y-2">
                  {p.documents.map((d) => (
                    <li key={d.id} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="text-sm">
                        <span className="font-medium">{d.kind}</span>{' '}
                        <span className="ml-2 rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700 ring-1 ring-zinc-200">
                          {d.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => viewDoc(d.id)}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                          disabled={pending}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewDoc(d.id, 'APPROVED')}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                          disabled={pending}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => reviewDoc(d.id, 'REJECTED')}
                          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                          disabled={pending}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-zinc-600">No documents uploaded yet.</p>
              )}
            </div>
          </div>
        ))}

        {!profiles.length ? (
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700">
            No KYC profiles yet.
          </div>
        ) : null}
      </div>
    </div>
  );
}

