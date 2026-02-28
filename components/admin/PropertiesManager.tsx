'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

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

export function PropertiesManager({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [slug, setSlug] = React.useState('');
  const [name, setName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [heroImage, setHeroImage] = React.useState('');

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/properties', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug,
            name,
            location,
            description,
            heroImage: heroImage || null,
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
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (e.g. havre-de-la-calme-ota)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (e.g. Ota, Ogun State)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
            required
          />
          <input
            value={heroImage}
            onChange={(e) => setHeroImage(e.target.value)}
            placeholder="Hero image path (optional, e.g. /images/havre front.jpg)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            rows={3}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
            required
          />
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
