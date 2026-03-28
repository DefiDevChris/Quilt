import fs from 'fs';
import path from 'path';
import {
  tutorialFrontmatterSchema,
  blogFrontmatterSchema,
  DIFFICULTY_ORDER,
  type TutorialEntry,
  type BlogEntry,
  type TutorialFrontmatter,
} from '@/lib/mdx-schemas';

const CONTENT_DIR = path.join(process.cwd(), 'src', 'content');
const TUTORIALS_DIR = path.join(CONTENT_DIR, 'tutorials');
const BLOG_DIR = path.join(CONTENT_DIR, 'blog');

// --- Frontmatter parsing ---

function parseFrontmatter(raw: string): {
  readonly data: Record<string, unknown>;
  readonly content: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    return { data: {}, content: raw };
  }

  const frontmatterRaw = match[1];
  const content = match[2];
  const data: Record<string, unknown> = {};

  for (const line of frontmatterRaw.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: unknown = line.slice(colonIndex + 1).trim();

    // Handle YAML-like arrays
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim().replace(/^["']|["']$/g, ''));
    }
    // Handle numbers
    else if (typeof value === 'string' && /^\d+$/.test(value)) {
      value = parseInt(value, 10);
    }
    // Strip surrounding quotes
    else if (typeof value === 'string') {
      value = value.replace(/^["']|["']$/g, '');
    }

    data[key] = value;
  }

  return { data, content: content.trim() };
}

// --- File reading ---

function readMdxFiles(dir: string): readonly { filename: string; raw: string }[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.mdx'));
  return files.map((filename) => ({
    filename,
    raw: fs.readFileSync(path.join(dir, filename), 'utf-8'),
  }));
}

// --- Tutorials ---

export function getAllTutorials(): readonly TutorialEntry[] {
  const files = readMdxFiles(TUTORIALS_DIR);

  return files
    .map(({ raw }) => {
      const { data, content } = parseFrontmatter(raw);
      const parsed = tutorialFrontmatterSchema.safeParse(data);
      if (!parsed.success) return null;
      return { ...parsed.data, content } as TutorialEntry;
    })
    .filter((entry): entry is TutorialEntry => entry !== null)
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty];
    });
}

export function getTutorialBySlug(slug: string): TutorialEntry | null {
  const tutorials = getAllTutorials();
  return tutorials.find((t) => t.slug === slug) ?? null;
}

export function getTutorialSlugs(): readonly string[] {
  return getAllTutorials().map((t) => t.slug);
}

export function filterTutorialsByDifficulty(
  difficulty: TutorialFrontmatter['difficulty']
): readonly TutorialEntry[] {
  return getAllTutorials().filter((t) => t.difficulty === difficulty);
}

// --- Blog ---

export function getAllBlogPosts(): readonly BlogEntry[] {
  const files = readMdxFiles(BLOG_DIR);

  return files
    .map(({ raw }) => {
      const { data, content } = parseFrontmatter(raw);
      const parsed = blogFrontmatterSchema.safeParse(data);
      if (!parsed.success) return null;
      return { ...parsed.data, content } as BlogEntry;
    })
    .filter((entry): entry is BlogEntry => entry !== null)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getBlogPostBySlug(slug: string): BlogEntry | null {
  const posts = getAllBlogPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

export function getBlogSlugs(): readonly string[] {
  return getAllBlogPosts().map((p) => p.slug);
}

export function getBlogPostsByTag(tag: string): readonly BlogEntry[] {
  return getAllBlogPosts().filter((p) =>
    p.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
  );
}

export function getAllBlogTags(): readonly string[] {
  const tags = new Set<string>();
  for (const post of getAllBlogPosts()) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}

export function paginateBlogPosts(
  page: number,
  perPage: number
): {
  readonly posts: readonly BlogEntry[];
  readonly totalPages: number;
  readonly totalPosts: number;
} {
  const safePage = Math.max(1, page);
  const safePerPage = Math.max(1, perPage);
  const allPosts = getAllBlogPosts();
  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / safePerPage);
  const start = (safePage - 1) * safePerPage;
  const posts = allPosts.slice(start, start + safePerPage);
  return { posts, totalPages, totalPosts };
}

// --- Search ---

export function searchContent(query: string): {
  readonly tutorials: readonly TutorialEntry[];
  readonly blogPosts: readonly BlogEntry[];
} {
  const lowerQuery = query.toLowerCase();

  const tutorials = getAllTutorials().filter(
    (t) =>
      t.title.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );

  const blogPosts = getAllBlogPosts().filter(
    (p) =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );

  return { tutorials, blogPosts };
}

// --- RSS ---

export function generateRssFeed(siteUrl: string, posts: readonly BlogEntry[]): string {
  const items = posts
    .map(
      (post) => `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <description><![CDATA[${post.description}]]></description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <guid>${siteUrl}/blog/${post.slug}</guid>
      <author><![CDATA[${post.author}]]></author>
      ${post.tags.map((t) => `<category><![CDATA[${t}]]></category>`).join('\n      ')}
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>QuiltCorgi Blog</title>
    <link>${siteUrl}/blog</link>
    <description>Design quilts in your browser. Tips, tutorials, and updates from the QuiltCorgi team.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}
