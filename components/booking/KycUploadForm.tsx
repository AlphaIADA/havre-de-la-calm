'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/Button';

type Doc = {
  id: string;
  kind: string;
  status: string;
  createdAt: string;
};

const kinds = [
  { value: 'ID_FRONT', label: 'ID (front)' },
  { value: 'ID_BACK', label: 'ID (back)' },
  { value: 'SELFIE', label: 'Selfie' },
  { value: 'PROOF_OF_ADDRESS', label: 'Proof of address' },
] as const;

export function KycUploadForm(props: { bookingCode: string; documents: Doc[]; uploadsEnabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [kind, setKind] = React.useState<(typeof kinds)[number]['value']>('ID_FRONT');
  const [file, setFile] = React.useState<File | null>(null);

  const onUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!props.uploadsEnabled) {
      toast.error('Uploads are disabled', { description: 'Configure Cloudinary env vars.' });
      return;
    }
    if (!file) {
      toast.error('Select a file to upload');
      return;
    }

    startTransition(async () => {
      try {
        const form = new FormData();
        form.set('kind', kind);
        form.set('file', file);

        const res = await fetch(`/api/booking/${props.bookingCode}/kyc/upload`, {
          method: 'POST',
          body: form,
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Upload failed');
        }
        toast.success('Document uploaded');
        setFile(null);
        router.refresh();
      } catch (err) {
        toast.error('Upload failed', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={onUpload} className="grid gap-4 md:grid-cols-3 md:items-end">
        <div className="space-y-2">
          <label className="text-sm font-medium">Document type</label>
          <select
            value={kind}
            onChange={(e) => {
              const value = e.target.value;
              const next = kinds.find((k) => k.value === value)?.value ?? 'ID_FRONT';
              setKind(next);
            }}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900/15"
          >
            {kinds.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 md:col-span-2">
          <label className="text-sm font-medium">File (max 10MB)</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-3">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? 'Uploading…' : 'Upload document'}
          </Button>
        </div>
      </form>

      {props.documents.length ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <div className="text-sm font-semibold">Uploaded documents</div>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            {props.documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3">
                <span className="font-medium">{d.kind}</span>
                <span className="rounded-full bg-white px-2 py-1 text-xs text-zinc-600 ring-1 ring-zinc-200">
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-zinc-500">
            For security, documents are only viewable by ADMIN/STAFF during verification.
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-600">No documents uploaded yet.</p>
      )}
    </div>
  );
}
