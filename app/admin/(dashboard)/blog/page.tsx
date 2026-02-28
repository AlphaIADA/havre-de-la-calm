import { BlogPostsManager, type BlogPostRow } from '@/components/admin/BlogPostsManager';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Blog' };
export const dynamic = 'force-dynamic';

export default async function AdminBlogPage() {
  const prisma = getPrisma();
  const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  const view: BlogPostRow[] = posts.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    status: p.status,
    publishedAt: p.publishedAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
  }));

  return <BlogPostsManager posts={view} />;
}

