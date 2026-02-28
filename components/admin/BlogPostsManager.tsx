'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { Button } from '@/components/ui/Button';

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  createdAt: string;
};

export function BlogPostsManager({ posts }: { posts: BlogPostRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [slug, setSlug] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [excerpt, setExcerpt] = React.useState('');
  const [content, setContent] = React.useState('');
  const [status, setStatus] = React.useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [seoTitle, setSeoTitle] = React.useState('');
  const [seoDescription, setSeoDescription] = React.useState('');
  const [ogImage, setOgImage] = React.useState('');

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/blogposts', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            slug,
            title,
            excerpt: excerpt || null,
            content,
            status,
            seoTitle: seoTitle || null,
            seoDescription: seoDescription || null,
            ogImage: ogImage || null,
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? 'Create failed');
        }
        toast.success('Post created');
        setSlug('');
        setTitle('');
        setExcerpt('');
        setContent('');
        setStatus('DRAFT');
        setSeoTitle('');
        setSeoDescription('');
        setOgImage('');
        router.refresh();
      } catch (err) {
        toast.error('Could not create post', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  const togglePublish = (p: BlogPostRow) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/blogposts/${p.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ status: p.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }),
        });
        if (!res.ok) throw new Error('Update failed');
        toast.success('Post updated');
        router.refresh();
      } catch (err) {
        toast.error('Could not update post', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold">Blog manager</h2>
        <p className="mt-1 text-sm text-zinc-600">Create, edit, and publish posts with SEO fields.</p>
      </div>

      <form onSubmit={onCreate} className="grid gap-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
        <div className="text-sm font-semibold">Create post</div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
            required
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Slug (e.g. pay-now-vs-pay-later)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            required
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT')}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            placeholder="Excerpt (optional)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            placeholder="Content"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
            required
          />
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="SEO title (optional)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
          />
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={2}
            placeholder="SEO description (optional)"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
          />
          <input
            value={ogImage}
            onChange={(e) => setOgImage(e.target.value)}
            placeholder="OG image path (optional) e.g. /images/bg_2.jpg"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm md:col-span-2"
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? 'Creating…' : 'Create post'}
        </Button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-zinc-200">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs text-zinc-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className="border-t border-zinc-200">
                <td className="px-4 py-3 font-medium">{p.title}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.slug}</td>
                <td className="px-4 py-3">{p.status}</td>
                <td className="px-4 py-3 text-zinc-700">{p.publishedAt ? p.publishedAt.slice(0, 10) : '—'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/admin/blog/${p.id}`}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => togglePublish(p)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-60"
                      disabled={pending}
                    >
                      {p.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </button>
                    <a
                      className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {!posts.length ? (
              <tr>
                <td className="px-4 py-8 text-center text-zinc-600" colSpan={5}>
                  No posts yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
