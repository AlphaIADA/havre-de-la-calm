'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ImageListField } from '@/components/admin/ImageListField';
import { Button } from '@/components/ui/Button';

type Property = {
  id: string;
  slug: string;
  name: string;
  location: string;
  description: string;
  address: string | null;
  heroImage: string | null;
  gallery: string[];
  active: boolean;
};

export function PropertyEditor({ property }: { property: Property }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [name, setName] = React.useState(property.name);
  const [location, setLocation] = React.useState(property.location);
  const [description, setDescription] = React.useState(property.description);
  const [address, setAddress] = React.useState(property.address ?? '');
  const [heroImage, setHeroImage] = React.useState(property.heroImage ?? '');
  const [gallery, setGallery] = React.useState<string[]>(property.gallery ?? []);

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const hero = heroImage.trim() ? heroImage.trim() : gallery[0] ? gallery[0] : null;
        const res = await fetch(`/api/admin/properties/${property.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            name,
            location,
            description,
            address: address || null,
            heroImage: hero,
            gallery,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Save failed');
        toast.success('Property saved');
        router.refresh();
      } catch (err) {
        toast.error('Could not save property', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs text-zinc-500">Slug: {property.slug}</div>
        <h2 className="text-base font-semibold">Edit property</h2>
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
            <label className="text-sm font-medium">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Address (optional)</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-4 md:col-span-2">
            <ImageListField
              label="Hero image"
              helpText="Upload a cover image (Cloudflare R2) or paste a /public image path."
              prefix={`properties/${property.slug}`}
              multiple={false}
              maxFiles={1}
              value={heroImage ? [heroImage] : []}
              onChange={(next) => setHeroImage(next[0] ?? '')}
              disabled={pending}
            />
            <ImageListField
              label="Gallery images"
              helpText="Upload multiple images and reorder them."
              prefix={`properties/${property.slug}`}
              multiple
              maxFiles={20}
              value={gallery}
              onChange={setGallery}
              disabled={pending}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              required
            />
          </div>
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
