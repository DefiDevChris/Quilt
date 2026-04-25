import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { blogPosts, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import FeaturedCarousel from '@/components/blog/FeaturedCarousel';
import AsymmetricPostFeed from '@/components/blog/AsymmetricPostFeed';
import Mascot from '@/components/landing/Mascot';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Stories — QuiltCorgi',
  description:
    'Quilting inspiration, pattern explorations, and creative narratives from our community.',
};

export default async function BlogPage() {
  const posts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      featuredImageUrl: blogPosts.featuredImageUrl,
      category: blogPosts.category,
      createdAt: blogPosts.createdAt,
      authorName: users.name,
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .where(eq(blogPosts.status, 'published'))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(30);

  if (!posts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 relative">
        <div className="max-w-md text-center relative">
          <Mascot pose="sitting" size="xl" className="mx-auto mb-8 opacity-40" />
          <h2
            className="text-[32px] leading-[40px] font-semibold text-default mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            No stories yet
          </h2>
          <p className="text-dim leading-[28px] font-light">
            New content is being crafted. Return soon for fresh inspiration.
          </p>
        </div>
      </div>
    );
  }

  const featured = posts.slice(0, 4);
  const feed = posts.slice(4);

  return (
    <div className="w-full">
      <FeaturedCarousel posts={featured} />
      <AsymmetricPostFeed posts={feed.length ? feed : posts} />
    </div>
  );
}
