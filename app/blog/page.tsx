import Image from 'next/image';
import Link from 'next/link';

import { demoBlogPosts } from '@/lib/demoBlog';
import { listPublishedBlogPosts } from '@/lib/data/blog';
import { isDbConfigured } from '@/lib/env';

export const metadata = {
  title: 'Blog',
  description: 'Travel tips, booking updates, and announcements from OTA Apartments.',
};

export const dynamic = 'force-dynamic';

export default async function BlogIndexPage() {
  const posts = isDbConfigured() ? await listPublishedBlogPosts() : null;
  const items = posts?.length
    ? posts.map((p) => ({
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt ?? '',
        coverImage: p.ogImage ?? '/images/bg_1.jpg',
        publishedAt: (p.publishedAt ?? p.createdAt).toISOString().slice(0, 10),
      }))
    : demoBlogPosts;

  return (
    <div className="container-px py-10">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Updates, travel tips, and booking guidance.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {items.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover transition group-hover:scale-[1.02]"
              />
            </div>
            <div className="p-5">
              <div className="text-xs text-zinc-500">{post.publishedAt}</div>
              <div className="mt-2 text-lg font-semibold">{post.title}</div>
              <p className="mt-2 text-sm text-zinc-700">{post.excerpt}</p>
              <div className="mt-4 text-sm font-medium text-zinc-900">Read →</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
