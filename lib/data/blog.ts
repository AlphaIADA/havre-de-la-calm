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

export async function getPublishedBlogPostWithEngagement(slug: string) {
  const prisma = getPrisma();
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: 'PUBLISHED' },
    include: {
      comments: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
      reactions: { orderBy: [{ count: 'desc' }, { emoji: 'asc' }] },
    },
  });
  return post;
}
