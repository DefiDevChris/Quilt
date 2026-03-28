import type { Metadata } from 'next';
import { eq, desc, count } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { BlogGrid } from '@/components/blog/BlogGrid';
import type { BlogPostListItem } from '@/types/community';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog | QuiltCorgi',
  description:
    'News, tips, and behind-the-scenes updates from the QuiltCorgi team. Learn about quilt design, new features, and the quilting community.',
};

function calculateReadTime(content: unknown): number {
  const charCount = JSON.stringify(content ?? '').length;
  return Math.max(1, Math.ceil(charCount / 1500));
}

export default async function BlogPage() {
  const whereClause = eq(blogPosts.status, 'published');

  const [postRows, [totalRow]] = await Promise.all([
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

  const total = totalRow?.count ?? 0;

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

  return (
    <>
      <h1 className="text-headline-lg font-bold text-on-surface mb-2">Blog</h1>
      <p className="text-body-lg text-secondary mb-8">
        News, tips, and updates from the QuiltCorgi team.
      </p>
      <BlogGrid initialPosts={initialPosts} initialTotal={total} />
    </>
  );
}
