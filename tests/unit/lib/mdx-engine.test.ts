import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

vi.mock('fs');

import {
  getAllBlogPosts,
  getBlogPostBySlug,
  getBlogPostsByTag,
  getAllBlogTags,
  paginateBlogPosts,
  generateRssFeed,
} from '@/lib/mdx-utils';

const SAMPLE_BLOG_POST = `---
title: "Introducing QuiltCorgi"
slug: "introducing-quiltcorgi"
description: "Design quilts in your browser"
author: "QuiltCorgi Team"
publishedAt: "2026-03-01"
tags: ["announcement", "launch"]
---

We're excited to launch!`;

const SAMPLE_BLOG_POST_2 = `---
title: "Why Free Tools Matter"
slug: "why-free-tools"
description: "Accessible design for everyone"
author: "QuiltCorgi Team"
publishedAt: "2026-03-15"
tags: ["philosophy", "free"]
---

Everyone deserves access.`;

function setupMocks(blogFiles: Record<string, string>) {
  vi.mocked(fs.existsSync).mockImplementation((dir: fs.PathLike) => {
    const dirStr = String(dir);
    if (dirStr.includes('blog')) return Object.keys(blogFiles).length > 0;
    return false;
  });

  // @ts-expect-error -- mock returns string[] instead of Dirent[]
  vi.mocked(fs.readdirSync).mockImplementation((dir: fs.PathLike) => {
    const dirStr = String(dir);
    if (dirStr.includes('blog')) return Object.keys(blogFiles);
    return [];
  });

  vi.mocked(fs.readFileSync).mockImplementation((filePath: fs.PathOrFileDescriptor) => {
    const fileStr = String(filePath);
    for (const [name, content] of Object.entries(blogFiles)) {
      if (fileStr.endsWith(name)) return content;
    }
    return '';
  });
}

describe('mdx-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllBlogPosts', () => {
    it('parses and returns posts sorted by date descending', () => {
      setupMocks({
        'introducing.mdx': SAMPLE_BLOG_POST,
        'why-free.mdx': SAMPLE_BLOG_POST_2,
      });

      const posts = getAllBlogPosts();
      expect(posts).toHaveLength(2);
      expect(posts[0].slug).toBe('why-free-tools');
      expect(posts[1].slug).toBe('introducing-quiltcorgi');
    });
  });

  describe('getBlogPostBySlug', () => {
    it('returns matching post', () => {
      setupMocks({ 'introducing.mdx': SAMPLE_BLOG_POST });
      const post = getBlogPostBySlug('introducing-quiltcorgi');
      expect(post).not.toBeNull();
      expect(post?.author).toBe('QuiltCorgi Team');
    });
  });

  describe('getBlogPostsByTag', () => {
    it('filters by tag case-insensitively', () => {
      setupMocks({
        'introducing.mdx': SAMPLE_BLOG_POST,
        'why-free.mdx': SAMPLE_BLOG_POST_2,
      });

      const launches = getBlogPostsByTag('Launch');
      expect(launches).toHaveLength(1);
      expect(launches[0].slug).toBe('introducing-quiltcorgi');
    });
  });

  describe('getAllBlogTags', () => {
    it('returns deduplicated sorted tags', () => {
      setupMocks({
        'introducing.mdx': SAMPLE_BLOG_POST,
        'why-free.mdx': SAMPLE_BLOG_POST_2,
      });

      const tags = getAllBlogTags();
      expect(tags).toEqual(['announcement', 'free', 'launch', 'philosophy']);
    });
  });

  describe('paginateBlogPosts', () => {
    it('returns correct page of posts', () => {
      setupMocks({
        'introducing.mdx': SAMPLE_BLOG_POST,
        'why-free.mdx': SAMPLE_BLOG_POST_2,
      });

      const result = paginateBlogPosts(1, 1);
      expect(result.posts).toHaveLength(1);
      expect(result.totalPages).toBe(2);
      expect(result.totalPosts).toBe(2);
    });
  });

  describe('generateRssFeed', () => {
    it('generates valid RSS XML', () => {
      setupMocks({ 'introducing.mdx': SAMPLE_BLOG_POST });
      const posts = getAllBlogPosts();
      const rss = generateRssFeed('https://quiltcorgi.com', posts);

      expect(rss).toContain('<?xml version="1.0"');
      expect(rss).toContain('<rss version="2.0"');
      expect(rss).toContain('<title><![CDATA[Introducing QuiltCorgi]]></title>');
      expect(rss).toContain('<link>https://quiltcorgi.com/blog/introducing-quiltcorgi</link>');
      expect(rss).toContain('<category><![CDATA[announcement]]></category>');
    });
  });
});
