import type { Metadata } from 'next';
import { BlogContent } from '@/components/social/BlogContent';
import { db } from '@/db';
import { blogPosts } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const metadata: Metadata = {
  title: 'Blog | QuiltCorgi',
  description:
    'Quilting tutorials, pattern inspiration, and design tips from the QuiltCorgi community.',
};

export default async function BlogPage() {
  const posts = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, 'published'))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(20);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-on-surface mb-3">Blog</h1>
          <p className="text-lg text-secondary">
            Quilting tutorials, pattern inspiration, and design tips.
          </p>
        </header>
        <BlogContent initialPosts={posts} initialTotal={posts.length} />
      </div>
    </div>
  );
}
