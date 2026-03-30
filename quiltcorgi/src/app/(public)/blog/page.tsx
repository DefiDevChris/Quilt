import type { Metadata } from 'next';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { BlogContent } from '@/components/social/BlogContent';
import type { BlogPostListItem } from '@/types/community';
import { calculateReadTime } from '@/lib/read-time';

export const metadata: Metadata = {
  title: 'Blog | QuiltCorgi',
  description: 'Tips, tutorials, and inspiration for quilters of every skill level.',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  let postRows: Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImageUrl: string | null;
    category: string;
    tags: string[];
    content: unknown;
    publishedAt: Date | null;
    authorName: string | null;
    authorAvatarUrl: string | null;
  }> = [];
  let total = 0;

  try {
    const whereClause = eq(blogPosts.status, 'published');

    const [rows, [totalRow]] = await Promise.all([
      db
        .select({
          id: blogPosts.id,
          title: blogPosts.title,
          slug: blogPosts.slug,
          excerpt: blogPosts.excerpt,
          featuredImageUrl: blogPosts.featuredImageUrl,
          category: blogPosts.category,
          tags: blogPosts.tags,
          content: blogPosts.content,
          publishedAt: blogPosts.publishedAt,
          authorName: users.name,
          authorAvatarUrl: userProfiles.avatarUrl,
        })
        .from(blogPosts)
        .leftJoin(users, eq(blogPosts.authorId, users.id))
        .leftJoin(userProfiles, eq(blogPosts.authorId, userProfiles.userId))
        .where(whereClause)
        .orderBy(desc(blogPosts.publishedAt))
        .limit(10),
      db.select({ count: count() }).from(blogPosts).where(whereClause),
    ]);

    postRows = rows;
    total = totalRow?.count ?? 0;
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    // Return empty state on error - don't crash the page
  }

  const initialPosts: BlogPostListItem[] = postRows.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImageUrl: post.featuredImageUrl,
    category: post.category,
    tags: post.tags,
    authorName: post.authorName ?? 'QuiltCorgi Team',
    authorAvatarUrl: post.authorAvatarUrl ?? null,
    publishedAt: post.publishedAt,
    readTimeMinutes: calculateReadTime(post.content),
  }));

  return <BlogContent initialPosts={initialPosts} initialTotal={total} />;
}
