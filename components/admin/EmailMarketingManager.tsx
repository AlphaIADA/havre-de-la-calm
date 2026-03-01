'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

type Segment = { id: string; name: string; criteria: unknown; createdAt: string };
type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  segmentId: string | null;
  segmentName: string | null;
  sentCount: number;
  recipientTotal: number | null;
  createdAt: string;
};

export function EmailMarketingManager(props: { segments: Segment[]; campaigns: Campaign[]; resendEnabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [segmentName, setSegmentName] = React.useState('');
  const [segmentType, setSegmentType] = React.useState<'ALL_GUESTS' | 'PAST_GUESTS'>('ALL_GUESTS');

  const [campaignName, setCampaignName] = React.useState('');
  const [campaignSubject, setCampaignSubject] = React.useState('');
  const [campaignHtml, setCampaignHtml] = React.useState('<p>Hello from OTA Apartments.</p>');
  const [campaignSegmentId, setCampaignSegmentId] = React.useState<string | ''>('');

  const createSegment = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/email/segments', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ name: segmentName, criteria: { type: segmentType } }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Create failed');
        }
        toast.success('Segment created');
        setSegmentName('');
        router.refresh();
      } catch (err) {
        toast.error('Could not create segment', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const createCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/email/campaigns', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name: campaignName,
            subject: campaignSubject,
            html: campaignHtml,
            segmentId: campaignSegmentId || null,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Create failed');
        }
        toast.success('Campaign created');
        setCampaignName('');
        setCampaignSubject('');
        router.refresh();
      } catch (err) {
        toast.error('Could not create campaign', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const sendCampaign = (campaignId: string) => {
    if (!props.resendEnabled) {
      toast.error('Sending disabled', { description: 'Email sending is not configured.' });
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/email/campaigns/${campaignId}/send`, { method: 'POST' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Send failed');
        toast.success('Campaign send started', {
          description: `Sent ${body.attempted} • Progress ${body.sentCount ?? 0}/${body.total ?? 0}`,
        });
        router.refresh();
      } catch (err) {
        toast.error('Could not send campaign', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-base font-semibold">Email marketing</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Create segments and campaigns. Sending uses Resend when configured.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={createSegment} className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="text-sm font-semibold">Create segment</div>
          <input
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
            placeholder="Segment name"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
          <select
            value={segmentType}
            onChange={(e) => setSegmentType(e.target.value === 'PAST_GUESTS' ? 'PAST_GUESTS' : 'ALL_GUESTS')}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="ALL_GUESTS">All guests</option>
            <option value="PAST_GUESTS">Past guests (checked out)</option>
          </select>
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create segment'}
          </Button>
        </form>

        <form onSubmit={createCampaign} className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
          <div className="text-sm font-semibold">Create campaign</div>
          <input
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="Campaign name"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={campaignSubject}
            onChange={(e) => setCampaignSubject(e.target.value)}
            placeholder="Subject"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
          <select
            value={campaignSegmentId}
            onChange={(e) => setCampaignSegmentId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">No segment</option>
            {props.segments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <textarea
            value={campaignHtml}
            onChange={(e) => setCampaignHtml(e.target.value)}
            rows={6}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          />
          <Button type="submit" disabled={pending}>
            {pending ? 'Creating…' : 'Create campaign'}
          </Button>
        </form>
      </div>

      <div className="overflow-hidden rounded-3xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Segment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {props.campaigns.map((c) => (
              <tr key={c.id} className="border-t border-zinc-200">
                <td className="px-4 py-3">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-xs text-zinc-500">{c.subject}</div>
                </td>
                <td className="px-4 py-3 text-zinc-700">{c.segmentName ?? '—'}</td>
                <td className="px-4 py-3 text-zinc-700">{c.status}</td>
                <td className="px-4 py-3 text-zinc-700">
                  {c.recipientTotal === null ? '—' : `${c.sentCount}/${c.recipientTotal}`}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-8 px-3 py-1 text-xs"
                    onClick={() => sendCampaign(c.id)}
                    disabled={pending || c.status === 'SENT'}
                  >
                    {c.status === 'SENT' ? 'Sent' : c.status === 'FAILED' ? 'Resume (50)' : 'Send next (50)'}
                  </Button>
                </td>
              </tr>
            ))}
            {!props.campaigns.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-600" colSpan={5}>
                  No campaigns yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-zinc-500">
        Resend: {props.resendEnabled ? 'Enabled' : 'Disabled'} • Sends 50 recipients per batch.
      </div>
    </div>
  );
}
