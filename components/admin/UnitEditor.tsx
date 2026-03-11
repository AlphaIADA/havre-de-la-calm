'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ImageListField } from '@/components/admin/ImageListField';
import { Button } from '@/components/ui/Button';

type Unit = {
  id: string;
  slug: string;
  propertyName: string;
  name: string;
  summary: string | null;
  maxGuests: number;
  minNights: number;
  baseNightly: number;
  weekendNightly: number | null;
  cleaningFee: number;
  depositFee: number;
  images: string[];
  amenities: string[];
  rules: string[];
  active: boolean;
};

function toLines(values: string[]) {
  return (values ?? []).join('\n');
}

function fromLines(value: string) {
  return value
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);
}

export function UnitEditor({ unit }: { unit: Unit }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [name, setName] = React.useState(unit.name);
  const [summary, setSummary] = React.useState(unit.summary ?? '');
  const [maxGuests, setMaxGuests] = React.useState(unit.maxGuests);
  const [minNights, setMinNights] = React.useState(unit.minNights);
  const [baseNightly, setBaseNightly] = React.useState(unit.baseNightly);
  const [weekendNightly, setWeekendNightly] = React.useState<number | ''>(
    unit.weekendNightly ?? '',
  );
  const [cleaningFee, setCleaningFee] = React.useState(unit.cleaningFee);
  const [depositFee, setDepositFee] = React.useState(unit.depositFee);
  const [active, setActive] = React.useState(unit.active);

  const [images, setImages] = React.useState<string[]>(unit.images ?? []);
  const [amenities, setAmenities] = React.useState(toLines(unit.amenities));
  const [rules, setRules] = React.useState(toLines(unit.rules));

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/units/${unit.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name,
            summary: summary.trim() ? summary.trim() : null,
            maxGuests,
            minNights,
            baseNightly,
            weekendNightly: weekendNightly === '' ? null : weekendNightly,
            cleaningFee,
            depositFee,
            images,
            amenities: fromLines(amenities),
            rules: fromLines(rules),
            active,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Save failed');
        toast.success('Unit saved');
        router.refresh();
      } catch (err) {
        toast.error('Could not save unit', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-zinc-500">
          {unit.propertyName} • Slug: {unit.slug}
        </div>
        <h2 className="text-base font-semibold">Edit unit</h2>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Summary (optional)</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Short description shown on listings"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Max guests</label>
            <input
              type="number"
              min={1}
              max={30}
              value={maxGuests}
              onChange={(e) => setMaxGuests(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Min nights</label>
            <input
              type="number"
              min={1}
              max={30}
              value={minNights}
              onChange={(e) => setMinNights(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Base nightly (NGN)</label>
            <input
              type="number"
              min={0}
              value={baseNightly}
              onChange={(e) => setBaseNightly(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Weekend nightly (optional)</label>
            <input
              type="number"
              min={0}
              value={weekendNightly}
              onChange={(e) => setWeekendNightly(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Leave blank for same as base"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Booking fee</label>
            <input
              type="number"
              min={0}
              value={cleaningFee}
              onChange={(e) => setCleaningFee(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Refundable deposit</label>
            <input
              type="number"
              min={0}
              value={depositFee}
              onChange={(e) => setDepositFee(Number(e.target.value))}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-3 md:col-span-2">
            <ImageListField
              label="Unit images"
              helpText="Upload images (Cloudflare R2) or paste a /public image path. Reorder to change the gallery order."
              prefix={`units/${unit.slug}`}
              multiple
              maxFiles={30}
              value={images}
              onChange={setImages}
              disabled={pending}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Amenities (one per line)</label>
            <textarea
              value={amenities}
              onChange={(e) => setAmenities(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Wi‑Fi"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">House rules (one per line)</label>
            <textarea
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="No smoking indoors"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
          <Button type="submit" disabled={pending}>
            {pending ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
