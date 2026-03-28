import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { blogPosts, users } from '@/db/schema';

export const dynamic = 'force-dynamic';

const SITE_URL = 'https://quiltcorgi.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  try {
    const postRows = await db
      .select({
        title: blogPosts.title,
        slug: blogPosts.slug,
        excerpt: blogPosts.excerpt,
        category: blogPosts.category,
        publishedAt: blogPosts.publishedAt,
        authorName: users.name,
      })
      .from(blogPosts)
      .leftJoin(users, eq(blogPosts.authorId, users.id))
      .where(eq(blogPosts.status, 'published'))
      .orderBy(desc(blogPosts.publishedAt))
      .limit(20);

    const items = postRows
      .map((post) => {
        const pubDate = post.publishedAt
          ? new Date(post.publishedAt).toUTCString()
          : new Date().toUTCString();
        const description = post.excerpt ?? '';

        return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${escapeXml(post.slug)}</link>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(post.category)}</category>
      <author>${escapeXml(post.authorName ?? 'QuiltCorgi Team')}</author>
      <pubDate>${pubDate}</pubDate>
      <guid>${SITE_URL}/blog/${escapeXml(post.slug)}</guid>
    </item>`;
      })
      .join('\n');

    const lastBuildDate =
      postRows.length > 0 && postRows[0]?.publishedAt
        ? new Date(postRows[0].publishedAt).toUTCString()
        : new Date().toUTCString();

    const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>QuiltCorgi Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>News, tips, and updates from the QuiltCorgi team.</description>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>`;

    return new Response(feed, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>QuiltCorgi Blog</title></channel></rss>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
