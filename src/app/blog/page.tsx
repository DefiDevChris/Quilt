import type { Metadata } from 'next';
import { BlogContent } from '@/components/social/BlogContent';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog | QuiltCorgi',
  description:
    'Quilting tutorials, pattern inspiration, and design tips from the QuiltCorgi community.',
};

export default async function BlogPage() {
  const posts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      content: blogPosts.content,
      excerpt: blogPosts.excerpt,
      featuredImageUrl: blogPosts.featuredImageUrl,
      category: blogPosts.category,
      publishedAt: blogPosts.publishedAt,
      updatedAt: blogPosts.updatedAt,
      authorName: users.name,
      authorAvatarUrl: userProfiles.avatarUrl,
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(blogPosts.status, 'published'))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(20);

  const postsWithReadTime = posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    featuredImageUrl: post.featuredImageUrl,
    category: post.category ?? 'Uncategorized',
    tags: [],
    authorName: post.authorName ?? 'Anonymous',
    authorAvatarUrl: post.authorAvatarUrl,
    publishedAt: post.publishedAt,
    readTimeMinutes: post.content
      ? Math.max(1, Math.ceil(String(post.content).split(/\s+/).length / 200))
      : 1,
  }));

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-on-surface mb-3">Blog</h1>
          <p className="text-lg text-secondary">
            Quilting tutorials, pattern inspiration, and design tips.
          </p>
        </header>
        <BlogContent initialPosts={postsWithReadTime} initialTotal={postsWithReadTime.length} />
      </div>
    </div>
  );
}
