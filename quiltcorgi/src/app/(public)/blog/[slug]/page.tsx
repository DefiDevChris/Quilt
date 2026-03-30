import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq, and, desc, ne } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users, userProfiles } from '@/db/schema';
import { BlogPostView } from '@/components/blog/BlogPostView';
import type { BlogPostListItem } from '@/types/community';
import { calculateReadTime } from '@/lib/read-time';

export const dynamic = 'force-dynamic';

const getPostBySlug = cache(async (slug: string) => {
  const [post] = await db
    .select({
      id: blogPosts.id,
      authorId: blogPosts.authorId,
      title: blogPosts.title,
      slug: blogPosts.slug,
      content: blogPosts.content,
      excerpt: blogPosts.excerpt,
      featuredImageUrl: blogPosts.featuredImageUrl,
      category: blogPosts.category,
      tags: blogPosts.tags,
      status: blogPosts.status,
      publishedAt: blogPosts.publishedAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
      authorName: users.name,
      authorAvatarUrl: userProfiles.avatarUrl,
      authorBio: userProfiles.bio,
      authorUsername: userProfiles.username,
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(userProfiles, eq(blogPosts.authorId, userProfiles.userId))
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'published')))
    .limit(1);
  return post ?? null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.authorName ?? 'QuiltCorgi Team'],
      tags: [...post.tags],
      images: post.featuredImageUrl ? [{ url: post.featuredImageUrl }] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Fetch related posts (same category, max 3), fall back to recent posts
  const relatedSelect = {
    id: blogPosts.id,
    title: blogPosts.title,
    slug: blogPosts.slug,
    excerpt: blogPosts.excerpt,
    featuredImageUrl: blogPosts.featuredImageUrl,
    category: blogPosts.category,
    tags: blogPosts.tags,
    content: blogPosts.content,
    publishedAt: blogPosts.publishedAt,
    authorName: users.name,
    authorAvatarUrl: userProfiles.avatarUrl,
  };

  const relatedRows = await db
    .select(relatedSelect)
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.authorId, users.id))
    .leftJoin(userProfiles, eq(blogPosts.authorId, userProfiles.userId))
    .where(
      and(
        eq(blogPosts.status, 'published'),
        eq(blogPosts.category, post.category),
        ne(blogPosts.id, post.id)
      )
    )
    .orderBy(desc(blogPosts.publishedAt))
    .limit(3);

  // If fewer than 3 category matches, backfill with recent posts from any category
  let allRelatedRows = relatedRows;
  if (relatedRows.length < 3) {
    const existingIds = new Set([post.id, ...relatedRows.map((r) => r.id)]);
    const recentRows = await db
      .select(relatedSelect)
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .leftJoin(userProfiles, eq(blogPosts.authorId, userProfiles.userId))
      .where(and(eq(blogPosts.status, 'published'), ne(blogPosts.id, post.id)))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(3);

    const backfill = recentRows.filter((r) => !existingIds.has(r.id));
    allRelatedRows = [...relatedRows, ...backfill].slice(0, 3);
  }

  const relatedPosts: BlogPostListItem[] = allRelatedRows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    excerpt: r.excerpt,
    featuredImageUrl: r.featuredImageUrl,
    category: r.category,
    tags: r.tags,
    authorName: r.authorName ?? 'QuiltCorgi Team',
    authorAvatarUrl: r.authorAvatarUrl ?? null,
    publishedAt: r.publishedAt,
    readTimeMinutes: calculateReadTime(r.content),
  }));

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? '',
    author: {
      '@type': 'Person',
      name: post.authorName ?? 'QuiltCorgi Team',
    },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt?.toISOString(),
    image: post.featuredImageUrl ?? undefined,
    publisher: {
      '@type': 'Organization',
      name: 'QuiltCorgi',
      url: process.env.NEXT_PUBLIC_APP_URL ?? 'https://quiltcorgi.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://quiltcorgi.com'}/blog/${post.slug}`,
    },
  };

  const postData = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    content: post.content,
    excerpt: post.excerpt,
    featuredImageUrl: post.featuredImageUrl,
    category: post.category,
    tags: post.tags,
    publishedAt: post.publishedAt,
    readTimeMinutes: calculateReadTime(post.content),
    author: {
      name: post.authorName ?? 'QuiltCorgi Team',
      avatarUrl: post.authorAvatarUrl ?? null,
      bio: post.authorBio ?? null,
      username: post.authorUsername ?? null,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
      />
      <BlogPostView post={postData} relatedPosts={relatedPosts} />
    </>
  );
}
