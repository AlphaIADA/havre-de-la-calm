'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { ImageListField } from '@/components/admin/ImageListField';
import { Button } from '@/components/ui/Button';

type Property = {
  id: string;
  slug: string;
  name: string;
  location: string;
  description: string;
  heroImage: string | null;
  active: boolean;
};

function isValidSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function PropertiesManager({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [slug, setSlug] = React.useState('');
  const [name, setName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [heroImage, setHeroImage] = React.useState('');
  const [gallery, setGallery] = React.useState<string[]>([]);

  const slugOk = isValidSlug(slug);

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const hero = heroImage.trim() ? heroImage.trim() : gallery[0] ? gallery[0] : null;
        const res = await fetch('/api/admin/properties', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug,
            name,
            location,
            description,
            heroImage: hero,
            gallery,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Create failed');
        }
        toast.success('Property created');
        setSlug('');
        setName('');
        setLocation('');
        setDescription('');
        setHeroImage('');
        setGallery([]);
        router.refresh();
      } catch (err) {
        toast.error('Could not create property', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const onToggleActive = (p: Property) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/properties/${p.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ active: !p.active }),
        });
        if (!res.ok) throw new Error('Update failed');
        toast.success(p.active ? 'Property deactivated' : 'Property activated');
        router.refresh();
      } catch (err) {
        toast.error('Could not update property', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold">Properties</h2>
        <p className="mt-1 text-sm text-zinc-600">Create and manage multi-property inventory.</p>
      </div>

      <form onSubmit={onCreate} className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="text-sm font-semibold">Create property</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Havre De La Calme"
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono"
              placeholder="havre-de-la-calme-ota"
              required
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            />
            <div className="text-xs text-zinc-500">Used in URLs: /properties/&lt;slug&gt;</div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Ota, Ogun State"
              required
            />
          </div>

          <div className="space-y-4 md:col-span-2">
            <ImageListField
              label="Hero image"
              helpText="Upload a cover image (Cloudflare R2) or paste a /public image path."
              prefix={slugOk ? `properties/${slug}` : ''}
              multiple={false}
              maxFiles={1}
              value={heroImage ? [heroImage] : []}
              onChange={(next) => setHeroImage(next[0] ?? '')}
              disabled={pending || !slugOk}
            />
            <ImageListField
              label="Gallery images"
              helpText="Upload multiple images and reorder them."
              prefix={slugOk ? `properties/${slug}` : ''}
              multiple
              maxFiles={20}
              value={gallery}
              onChange={setGallery}
              disabled={pending || !slugOk}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Describe the property, neighborhood, and what makes it special."
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create property'}
        </Button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t border-zinc-200">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3 text-zinc-600">{p.slug}</td>
                <td className="px-4 py-3 text-zinc-600">{p.location}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ring-1 ${
                      p.active ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-zinc-50 text-zinc-600 ring-zinc-200'
                    }`}
                  >
                    {p.active ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/properties/${p.id}`}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => onToggleActive(p)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                      disabled={pending}
                    >
                      {p.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!properties.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-600" colSpan={5}>
                  No properties yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
