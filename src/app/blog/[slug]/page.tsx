import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { TiptapRenderer } from '@/components/editor/TiptapRenderer';
import Link from 'next/link';
import PostNavigation from '@/components/blog/PostNavigation';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
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
    <article className="min-h-screen bg-[#faf9f7]">
      {/* Full-bleed hero image */}
      {post.featuredImageUrl && (
        <div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
          <img
            src={post.featuredImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#faf9f7] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#faf9f7]/80 via-transparent to-transparent" />
        </div>
      )}

      {/* Content area */}
      <div className="relative">
        {/* Back link */}
        <div className="absolute -top-16 left-6 md:left-12 z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-3 text-sm text-[#5c4d42] hover:text-[#3a2e26] transition-colors group"
          >
            <span className="w-6 h-px bg-current transition-all duration-300 group-hover:w-10" />
            <span className="text-[10px] uppercase tracking-[0.2em] font-medium">Stories</span>
          </Link>
        </div>

        {/* Header */}
        <header className="max-w-3xl mx-auto px-6 md:px-12 pt-12 md:pt-20 pb-12">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#c48a28] font-medium">
              {post.category}
            </span>
            <span className="w-6 h-px bg-[#e8dfd5]" />
            <time className="text-[10px] uppercase tracking-[0.15em] text-[#7a6c60]">
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
            className="text-4xl md:text-5xl lg:text-6xl text-[#3a2e26] leading-[1.08] tracking-[-0.02em] mb-10"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-4">
            {post.authorAvatarUrl && (
              <img
                src={post.authorAvatarUrl}
                alt={post.authorName ?? 'Author'}
                className="w-10 h-10 rounded-[2px] object-cover"
              />
            )}
            <span className="text-sm text-[#5c4d42] font-medium">{post.authorName}</span>
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
