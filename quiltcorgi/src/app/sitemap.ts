export const dynamic = 'force-dynamic';

import type { MetadataRoute } from 'next';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, userProfiles, communityPosts } from '@/db/schema';

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
      url: `${BASE_URL}/socialthreads`,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/tutorials`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  const [publishedBlogPosts, profiles, approvedCommunityPosts] = await Promise.all([
    db
      .select({
        slug: blogPosts.slug,
        updatedAt: blogPosts.updatedAt,
      })
      .from(blogPosts)
      .where(eq(blogPosts.status, 'published')),
    db
      .select({
        username: userProfiles.username,
      })
      .from(userProfiles)
      .limit(50_000),
    db
      .select({
        id: communityPosts.id,
        createdAt: communityPosts.createdAt,
      })
      .from(communityPosts)
      .where(eq(communityPosts.status, 'approved')),
  ]);

  const blogEntries: MetadataRoute.Sitemap = publishedBlogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const profileEntries: MetadataRoute.Sitemap = profiles.map((profile) => ({
    url: `${BASE_URL}/members/${profile.username}`,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }));

  const communityEntries: MetadataRoute.Sitemap = approvedCommunityPosts.map((post) => ({
    url: `${BASE_URL}/socialthreads/${post.id}`,
    lastModified: post.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...blogEntries, ...profileEntries, ...communityEntries];
}
