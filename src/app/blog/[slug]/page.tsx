import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { TiptapRenderer } from '@/components/editor/TiptapRenderer';
import Link from 'next/link';

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

  return {
    title: post.title,
    description: post.excerpt || 'Read more on the QuiltCorgi blog.',
  };
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
      publishedAt: blogPosts.publishedAt,
      authorName: users.name,
      authorAvatarUrl: userProfiles.avatarUrl,
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
    .limit(1);

  if (!post || !post.content) notFound();

  return (
    <article className="max-w-3xl mx-auto">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary mb-8"
      >
        ← Back to Blog
      </Link>

      {post.featuredImageUrl && (
        <img
          src={post.featuredImageUrl}
          alt={post.title}
          className="w-full h-64 object-cover rounded-xl mb-8"
        />
      )}

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-on-surface tracking-tight mb-4">
          {post.title}
        </h1>
        <div className="flex items-center gap-3 text-sm text-secondary">
          {post.authorAvatarUrl && (
            <img
              src={post.authorAvatarUrl}
              alt={post.authorName ?? 'Author'}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="font-medium">{post.authorName}</span>
          <span>·</span>
          <time>
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : ''}
          </time>
        </div>
      </header>

      <div className="prose prose-slate max-w-none">
        <TiptapRenderer content={post.content} />
      </div>
    </article>
  );
}
