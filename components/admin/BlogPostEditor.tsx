'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

import { ImageListField } from '@/components/admin/ImageListField';
import { Button } from '@/components/ui/Button';

type Post = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: string | null;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  canonicalUrl: string;
  createdAt: string;
  updatedAt: string;
};

export function BlogPostEditor({ post }: { post: Post }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const [title, setTitle] = React.useState(post.title);
  const [excerpt, setExcerpt] = React.useState(post.excerpt);
  const [content, setContent] = React.useState(post.content);
  const [status, setStatus] = React.useState<'DRAFT' | 'PUBLISHED'>(post.status);
  const [seoTitle, setSeoTitle] = React.useState(post.seoTitle);
  const [seoDescription, setSeoDescription] = React.useState(post.seoDescription);
  const [ogImage, setOgImage] = React.useState(post.ogImage);
  const [inlineImages, setInlineImages] = React.useState<string[]>([]);
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

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await fetch(`/api/admin/blogposts/${post.id}`, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            title,
            excerpt: excerpt.trim() ? excerpt.trim() : null,
            content,
            status,
            seoTitle: seoTitle.trim() ? seoTitle.trim() : null,
            seoDescription: seoDescription.trim() ? seoDescription.trim() : null,
            ogImage: ogImage.trim() ? ogImage.trim() : null,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error ?? 'Save failed');
        toast.success('Post saved');
        router.refresh();
      } catch (err) {
        toast.error('Could not save post', {
          description: err instanceof Error ? err.message : 'Please try again.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs text-zinc-500">Slug: {post.slug}</div>
          <h2 className="text-base font-semibold">Edit post</h2>
          <div className="mt-1 text-xs text-zinc-500">
            Created {post.createdAt.slice(0, 10)} • Updated {post.updatedAt.slice(0, 10)}
            {post.publishedAt ? ` • Published ${post.publishedAt.slice(0, 10)}` : ''}
          </div>
        </div>
        <Link
          href={`/blog/${post.slug}`}
          target="_blank"
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:border-zinc-300 hover:text-zinc-900"
        >
          View public
        </Link>
      </div>

      <form onSubmit={onSave} className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
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
            <div className="space-y-2">
              <ImageListField
                label="Featured image (optional)"
                helpText="Used as the cover image (and OG image)."
                prefix={`blog/${post.slug}`}
                multiple={false}
                maxFiles={1}
                value={ogImage ? [ogImage] : []}
                onChange={(next) => setOgImage(next[0] ?? '')}
                disabled={pending}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <ImageListField
                label="Inline images (optional)"
                helpText="Uploads are inserted into the content as ![Image](url)."
                prefix={`blog/${post.slug}`}
                multiple
                maxFiles={50}
                value={inlineImages}
                onChange={setInlineImages}
                disabled={pending}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Excerpt (optional)</label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
            <div className="text-sm font-semibold">SEO</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
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
            </div>
          </div>
        </div>

        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? 'Saving…' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
