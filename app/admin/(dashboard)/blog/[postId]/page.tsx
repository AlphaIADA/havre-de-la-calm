import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BlogPostEditor } from '@/components/admin/BlogPostEditor';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Edit post' };
export const dynamic = 'force-dynamic';

export default async function AdminBlogPostEditPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const prisma = getPrisma();
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      id: true,
      slug: true,
      title: true,
      excerpt: true,
      content: true,
      status: true,
      publishedAt: true,
      seoTitle: true,
      seoDescription: true,
      ogImage: true,
      canonicalUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!post) return notFound();

  return (
    <div className="space-y-6">
      <Link href="/admin/blog" className="text-sm font-medium text-zinc-900 hover:underline">
        ← Back to blog manager
      </Link>
      <BlogPostEditor
        post={{
          id: post.id,
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt ?? '',
          content: post.content,
          status: post.status,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          seoTitle: post.seoTitle ?? '',
          seoDescription: post.seoDescription ?? '',
          ogImage: post.ogImage ?? '',
          canonicalUrl: post.canonicalUrl ?? '',
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString(),
        }}
      />
    </div>
  );
}

