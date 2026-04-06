import type { Metadata } from 'next';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import FeaturedCarousel from '@/components/blog/FeaturedCarousel';
import AsymmetricPostFeed from '@/components/blog/AsymmetricPostFeed';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog | QuiltCorgi',
  description:
    'Explore quilting tutorials, creative pattern inspiration, and expert design tips from the QuiltCorgi community.',
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
    .limit(25);

  if (posts.length === 0) {
    return (
      <div
        className="flex-grow flex items-center justify-center p-6"
        style={{ backgroundColor: '#FAFAF7', minHeight: '100vh' }}
      >
        <div
          className="max-w-md w-full text-center p-12"
          style={{ backgroundColor: '#FAFAF7', borderRadius: 2, border: '1px solid #e5e5e0' }}
        >
          <div
            className="w-20 h-20 flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: '#f5f5f0', borderRadius: 2 }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M8 7h6" />
              <path d="M8 11h8" />
            </svg>
          </div>
          <h2
            className="text-2xl font-normal text-[#1a1a1a] mb-2 font-serif"
            style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
          >
            No stories yet
          </h2>
          <p className="text-[#5a5a5a] font-normal">
            Our quilters are currently drafting new content. Check back soon for fresh inspiration.
          </p>
        </div>
      </div>
    );
  }

  const featuredPosts = posts.slice(0, 4);
  const regularPosts = posts.slice(4);

  return (
    <div className="flex flex-col w-full overflow-x-hidden" style={{ backgroundColor: '#FAFAF7' }}>
      <section className="w-full">
        <FeaturedCarousel posts={featuredPosts} />
      </section>

      <section className="w-full relative z-10" style={{ backgroundColor: '#FAFAF7' }}>
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-8">
          <div className="mb-10">
            <h2
              className="text-3xl md:text-4xl font-normal text-[#1a1a1a] tracking-tight font-serif"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              Recent Stories
            </h2>
          </div>
        </div>

        <AsymmetricPostFeed posts={regularPosts.length > 0 ? regularPosts : posts} />
      </section>
    </div>
  );
}
