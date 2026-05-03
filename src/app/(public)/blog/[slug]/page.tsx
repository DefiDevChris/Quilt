import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';
import { blogPosts, users } from '@/db/schema';
import { eq, and, desc, lt, gt, asc } from 'drizzle-orm';
import { TiptapRenderer } from '@/components/editor/TiptapRenderer';
import Link from 'next/link';
import PostNavigation from '@/components/blog/PostNavigation';

export const revalidate = 60;

const getPostBySlug = unstable_cache(
  async (slug: string) => {
    const [post] = await db
      .select({
        title: blogPosts.title,
        excerpt: blogPosts.excerpt,
        content: blogPosts.content,
        featuredImageUrl: blogPosts.featuredImageUrl,
        category: blogPosts.category,
        publishedAt: blogPosts.publishedAt,
        authorName: users.name,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
      .limit(1);
    return post ?? null;
  },
  ['blog-post'],
  { revalidate: 60 }
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) return { title: 'Post Not Found' };
  return { title: post.title, description: post.excerpt || 'Read more on QuiltCorgi.' };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const post = await getPostBySlug(slug);
  if (!post?.content) notFound();

  const publishedAt = post.publishedAt;
  const [prevResult, nextResult] = publishedAt
    ? await Promise.all([
        db
          .select({ slug: blogPosts.slug, title: blogPosts.title })
          .from(blogPosts)
          .where(and(eq(blogPosts.status, 'published'), lt(blogPosts.publishedAt, publishedAt)))
          .orderBy(desc(blogPosts.publishedAt))
          .limit(1),
        db
          .select({ slug: blogPosts.slug, title: blogPosts.title })
          .from(blogPosts)
          .where(and(eq(blogPosts.status, 'published'), gt(blogPosts.publishedAt, publishedAt)))
          .orderBy(asc(blogPosts.publishedAt))
          .limit(1),
      ])
    : [[], []];

  const prev = prevResult[0] ?? null;
  const next = nextResult[0] ?? null;

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
          <div className="absolute inset-0 bg-default/60" />
        </div>
      )}

      {/* Content area */}
      <div className="relative">
        {/* Back link */}
        <div className="absolute -top-16 left-6 md:left-12 z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-3 text-sm text-dim hover:text-primary transition-colors duration-150 group"
          >
            <span className="w-6 h-px bg-current" />
            <span className="text-[14px] leading-[20px]">Stories</span>
          </Link>
        </div>

        {/* Header */}
        <header className="max-w-3xl mx-auto px-6 md:px-12 pt-12 md:pt-20 pb-12">
          <div className="flex items-center gap-4 mb-8">
            <span className="text-[14px] leading-[20px] text-primary">{post.category}</span>
            <span className="w-6 h-px border-default" />
            <time className="text-[14px] leading-[20px] text-dim">
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
            className="text-[40px] leading-[52px] text-default mb-10"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {post.title}
          </h1>

          <div className="flex items-center gap-4">
            <span className="text-[14px] leading-[20px] text-default">{post.authorName}</span>
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
