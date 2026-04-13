export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { db } from '@/lib/db';
import { blogPosts } from '@/db/schema';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://quiltcorgi.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/shop`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const publishedBlogPosts = await db
    .select({
      slug: blogPosts.slug,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts);

  const blogEntries: MetadataRoute.Sitemap = publishedBlogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogEntries];
}
