import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Quilting tutorials, pattern inspiration, and design tips from the QuiltCorgi community.',
};

interface BlogPostCard {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  category: string;
  createdAt: Date | null;
  authorName: string | null;
  authorAvatarUrl: string | null;
}

function formatDate(date: Date | null): string {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

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
    .limit(20);

  return (
    <>
      <header className="mb-12">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight">Blog</h1>
        <p className="text-secondary mt-1">
          Quilting tutorials, pattern inspiration, and design tips.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="glass-panel-social rounded-[2rem] p-12 text-center">
          <p className="text-secondary font-medium">No posts yet</p>
          <p className="text-sm text-slate-400 mt-1">Check back soon for new content.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <BlogPostCard key={post.id} post={post} isFeatured={index === 0} />
          ))}
        </div>
      )}
    </>
  );
}

function BlogPostCard({ post, isFeatured }: { post: BlogPostCard; isFeatured?: boolean }) {
  const image = post.featuredImageUrl || '/images/quilts/quilt_01_bed_geometric.png';

  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group relative rounded-xl overflow-hidden bg-surface-container shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300 ${
        isFeatured ? 'md:col-span-2 lg:col-span-2' : ''
      }`}
    >
      <div className={`aspect-video overflow-hidden ${isFeatured ? 'lg:aspect-[21/9]' : ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {post.category}
          </span>
          {post.createdAt && (
            <span className="text-xs text-secondary">{formatDate(post.createdAt)}</span>
          )}
        </div>
        <h3
          className={`font-bold text-on-surface group-hover:text-primary transition-colors ${
            isFeatured ? 'text-xl' : 'text-lg'
          } line-clamp-2`}
        >
          {post.title}
        </h3>
        {post.excerpt && <p className="text-sm text-secondary mt-2 line-clamp-2">{post.excerpt}</p>}
        <div className="flex items-center gap-2 mt-4">
          {post.authorAvatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={post.authorAvatarUrl}
              alt={post.authorName ?? 'Author'}
              className="w-6 h-6 rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {(post.authorName ?? 'A').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-xs text-secondary font-medium">
            {post.authorName ?? 'QuiltCorgi Team'}
          </span>
        </div>
      </div>
    </Link>
  );
}
