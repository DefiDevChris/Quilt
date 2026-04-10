import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TiptapRenderer } from '@/components/editor/TiptapRenderer';
import Link from 'next/link';
import PostNavigation from '@/components/blog/PostNavigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select({ title: blogPosts.title, excerpt: blogPosts.excerpt })
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
    .limit(1);

  if (!post) return { title: 'Post Not Found' };
  return { title: post.title, description: post.excerpt || 'Read more on QuiltCorgi.' };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [post] = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      content: blogPosts.content,
      excerpt: blogPosts.excerpt,
      featuredImageUrl: blogPosts.featuredImageUrl,
      category: blogPosts.category,
      publishedAt: blogPosts.publishedAt,
      authorName: users.name,
      authorAvatarUrl: userProfiles.avatarUrl,
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
    .limit(1);

  if (!post?.content) notFound();

  const allPosts = await db
    .select({ slug: blogPosts.slug, title: blogPosts.title })
    .from(blogPosts)
    .where(eq(blogPosts.status, 'published'))
    .orderBy(desc(blogPosts.publishedAt));

  const currentIndex = allPosts.findIndex((p) => p.slug === slug);
  const prev = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const next = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;

  return (
    <article className="min-h-screen">
      {/* Full-bleed hero image */}
      {post.featuredImageUrl && (
        <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
          <div className="absolute inset-0">
            <img
              src={post.featuredImageUrl}
              alt={post.title}
              className="w-[130%] h-full object-cover"
              style={{ objectPosition: '20% 50%' }}
            />
          </div>
          <div className="absolute inset-0 bg-[#fdfaf7]/60" />
        </div>
      )}

      {/* Content area */}
      <div className="relative">
        {/* Back link */}
        <div className="absolute -top-16 left-6 md:left-12 z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-3 text-sm text-[#6b655e] hover:text-[#ff8d49] transition-colors duration-150 group"
          >
            <span className="w-6 h-px bg-current" />
            <span className="text-[14px] leading-[20px]">Stories</span>
          </Link>
        </div>

        {/* Header */}
        <header className="max-w-3xl mx-auto px-6 md:px-12 pt-12 md:pt-20 pb-12">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-[14px] leading-[20px] text-[#ff8d49]">
              {post.category}
            </span>
            <span className="w-6 h-px bg-[#e8e1da]" />
            <time className="text-[14px] leading-[20px] text-[#6b655e]">
              {post.publishedAt
                ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
                : ''}
            </time>
          </div>

          <h1
            className="text-[40px] leading-[52px] md:text-[40px] md:leading-[52px] text-[#2d2a26] mb-10"
            style={{ fontFamily: 'Spline Sans, sans-serif' }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-4">
            {post.authorAvatarUrl && (
              <img
                src={post.authorAvatarUrl}
                alt={post.authorName ?? 'Author'}
                className="w-10 h-10 rounded-full bg-[#ff8d49]/10 object-cover"
              />
            )}
            <span className="text-[14px] leading-[20px] text-[#2d2a26]">{post.authorName}</span>
          </div>
        </header>

        {/* Prose content */}
        <div className="max-w-3xl mx-auto px-6 md:px-12 pb-16">
          <div className="prose-editorial">
            <TiptapRenderer content={post.content} />
          </div>
        </div>
      </div>

      <PostNavigation prev={prev} next={next} />
    </article>
  );
}
