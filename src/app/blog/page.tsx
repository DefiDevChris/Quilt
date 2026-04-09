import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import FeaturedCarousel from '@/components/blog/FeaturedCarousel';
import AsymmetricPostFeed from '@/components/blog/AsymmetricPostFeed';

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
      authorAvatarUrl: userProfiles.avatarUrl,
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(blogPosts.status, 'published'))
    .orderBy(desc(blogPosts.publishedAt))
    .limit(30);

  if (!posts.length) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-8 flex items-center justify-center rounded-2xl bg-primary-container/40">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-secondary"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M8 7h6M8 11h8" />
            </svg>
          </div>
          <h2
            className="text-4xl font-bold text-on-surface mb-4 tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            No stories yet
          </h2>
          <p className="text-secondary leading-relaxed font-light">
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
