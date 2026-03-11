'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { ImageListField } from '@/components/admin/ImageListField';
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
  const [inlineImages, setInlineImages] = React.useState<string[]>([]);

  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  const lastInlineCount = React.useRef(0);

  React.useEffect(() => {
    if (inlineImages.length <= lastInlineCount.current) {
      lastInlineCount.current = inlineImages.length;
      return;
    }
    const newUrls = inlineImages.slice(lastInlineCount.current);
    lastInlineCount.current = inlineImages.length;
    if (!newUrls.length) return;
    setContent((current) => {
      const trimmed = current.trimEnd();
      const inject = newUrls.map((url) => `![Image](${url})`).join('\n');
      return trimmed ? `${trimmed}\n\n${inject}\n` : `${inject}\n`;
    });
  }, [inlineImages]);

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
        setInlineImages([]);
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
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Pay now vs pay later"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-mono"
              placeholder="pay-now-vs-pay-later"
              pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          <div className="space-y-4 md:col-span-2">
            <ImageListField
              label="Featured image (optional)"
              helpText="Used as the cover image (and OG image)."
              prefix={slugOk ? `blog/${slug}` : ''}
              multiple={false}
              maxFiles={1}
              value={ogImage ? [ogImage] : []}
              onChange={(next) => setOgImage(next[0] ?? '')}
              disabled={pending || !slugOk}
            />
            <ImageListField
              label="Inline images (optional)"
              helpText="Uploads are inserted into the content as ![Image](url)."
              prefix={slugOk ? `blog/${slug}` : ''}
              multiple
              maxFiles={30}
              value={inlineImages}
              onChange={setInlineImages}
              disabled={pending || !slugOk}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Excerpt (optional)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Short summary shown on the blog index."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="Write your post content. Separate paragraphs with new lines."
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">SEO title (optional)</label>
            <input
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="SEO title"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium">SEO description (optional)</label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              placeholder="SEO description"
            />
          </div>
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
