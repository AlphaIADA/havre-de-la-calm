import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

import { BlogEngagement } from '@/components/blog/BlogEngagement';
import { Button } from '@/components/ui/Button';
import { getDemoBlogPost } from '@/lib/demoBlog';
import { getPublishedBlogPostWithEngagement } from '@/lib/data/blog';
import { isDbConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const dbPost = isDbConfigured() ? await getPublishedBlogPostWithEngagement(slug) : null;
  const demoPost = getDemoBlogPost(slug);
  const title = dbPost?.seoTitle ?? dbPost?.title ?? demoPost?.title;
  const description = dbPost?.seoDescription ?? dbPost?.excerpt ?? demoPost?.excerpt;
  const image = dbPost?.ogImage ?? demoPost?.coverImage ?? '/images/bg_1.jpg';

  if (!title) return { title: 'Blog' };

  return {
    title,
    description,
    openGraph: {
      type: 'article',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dbPost = isDbConfigured() ? await getPublishedBlogPostWithEngagement(slug) : null;

  const post = dbPost
    ? {
        slug: dbPost.slug,
        title: dbPost.title,
        coverImage: dbPost.ogImage ?? '/images/bg_1.jpg',
        publishedAt: (dbPost.publishedAt ?? dbPost.createdAt).toISOString().slice(0, 10),
        content: dbPost.content,
      }
    : getDemoBlogPost(slug);

  if (!post) return notFound();

  return (
    <div className="container-px py-10">
      <div className="max-w-3xl">
        <Link href="/blog" className="text-sm font-medium text-zinc-900 hover:underline">
          ← Back to blog
        </Link>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{post.title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{post.publishedAt}</p>

        <div className="mt-6 relative aspect-[16/9] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100">
          <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
        </div>

        <article className="prose prose-zinc mt-8 max-w-none">
          {post.content
            .split('\n')
            .map((line, idx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;
              const img = trimmed.match(/^!\[(.*)\]\((.+)\)$/);
              if (img) {
                const alt = img[1]?.trim() || 'Image';
                const src = img[2]?.trim();
                if (!src) return null;
                return (
                  <div
                    key={`img-${idx}`}
                    className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100"
                  >
                    <Image src={src} alt={alt} fill className="object-cover" />
                  </div>
                );
              }
              return <p key={`p-${idx}`}>{trimmed}</p>;
            })}
        </article>

        {dbPost ? (
          <BlogEngagement
            slug={dbPost.slug}
            initialComments={dbPost.comments.map((c) => ({
              id: c.id,
              name: c.name,
              body: c.body,
              createdAt: c.createdAt.toISOString(),
            }))}
            initialReactions={dbPost.reactions.map((r) => ({ emoji: r.emoji, count: r.count }))}
          />
        ) : null}

        <div className="mt-10 rounded-3xl border border-zinc-200 bg-zinc-50 p-6">
          <div className="text-base font-semibold">Ready to book?</div>
          <p className="mt-2 text-sm text-zinc-600">
            Browse available stays and secure your dates.
          </p>
          <Link href="/properties" className="mt-4 inline-block">
            <Button>Browse stays</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
