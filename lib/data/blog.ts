import { getPrisma } from '@/lib/prisma';

export async function listPublishedBlogPosts() {
  const prisma = getPrisma();
  const posts = await prisma.blogPost.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
  });
  return posts;
}

export async function getBlogPostBySlug(slug: string) {
  const prisma = getPrisma();
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });
  return post;
}

