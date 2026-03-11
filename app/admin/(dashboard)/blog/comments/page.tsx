import { BlogCommentsManager } from '@/components/admin/BlogCommentsManager';
import { getPrisma } from '@/lib/prisma';

export const metadata = { title: 'Blog comments' };
export const dynamic = 'force-dynamic';

export default async function AdminBlogCommentsPage() {
  const prisma = getPrisma();
  const comments = await prisma.blogComment.findMany({
    include: { post: { select: { title: true, slug: true } } },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    take: 200,
  });

  const view = comments.map((c) => ({
    id: c.id,
    status: c.status,
    name: c.name,
    email: c.email ?? null,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    post: { slug: c.post.slug, title: c.post.title },
  }));

  return <BlogCommentsManager comments={view} />;
}

