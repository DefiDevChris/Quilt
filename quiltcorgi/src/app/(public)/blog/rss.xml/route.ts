import { getAllBlogPosts, generateRssFeed } from '@/lib/mdx-engine';

const SITE_URL = 'https://quiltcorgi.com';

export async function GET() {
  const posts = getAllBlogPosts();
  const feed = generateRssFeed(SITE_URL, posts);

  return new Response(feed, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
