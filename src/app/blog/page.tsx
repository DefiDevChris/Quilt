import type { Metadata } from 'next';
import { BlogContent } from '@/components/social/BlogContent';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog',
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
      createdAt: blogPosts.createdAt,
      authorName: users.name,
      authorAvatarUrl: userProfiles.avatarUrl,
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .orderBy(desc(blogPosts.createdAt))
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
    createdAt: post.createdAt,
    readTimeMinutes: post.content
      ? Math.max(1, Math.ceil(String(post.content).split(/\s+/).length / 200))
      : 1,
  }));

  return (
    <>
      <header className="mb-12">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Blog</h1>
        <p className="text-secondary mt-1">
          Quilting tutorials, pattern inspiration, and design tips.
        </p>
      </header>
      <BlogContent initialPosts={postsWithReadTime} initialTotal={postsWithReadTime.length} />
    </>
  );
}
