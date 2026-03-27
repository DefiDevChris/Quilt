import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';

vi.mock('fs');

import {
  getAllTutorials,
  getTutorialBySlug,
  filterTutorialsByDifficulty,
  getAllBlogPosts,
  getBlogPostBySlug,
  getBlogPostsByTag,
  getAllBlogTags,
  paginateBlogPosts,
  searchContent,
  generateRssFeed,
} from '@/lib/mdx-engine';

const SAMPLE_TUTORIAL = `---
title: "Getting Started"
slug: "getting-started"
difficulty: "beginner"
description: "Your first quilt design"
estimatedTime: "15 min"
publishedAt: "2026-01-15"
tags: ["beginner", "basics"]
order: 0
---

Welcome to QuiltCorgi!`;

const SAMPLE_TUTORIAL_2 = `---
title: "Advanced Layouts"
slug: "advanced-layouts"
difficulty: "advanced"
description: "Medallion and Lone Star"
estimatedTime: "25 min"
publishedAt: "2026-02-01"
tags: ["layout", "advanced"]
order: 2
---

Learn about layouts.`;

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

function setupMocks(tutorialFiles: Record<string, string>, blogFiles: Record<string, string>) {
  vi.mocked(fs.existsSync).mockImplementation((dir: fs.PathLike) => {
    const dirStr = String(dir);
    if (dirStr.includes('tutorials')) return Object.keys(tutorialFiles).length > 0;
    if (dirStr.includes('blog')) return Object.keys(blogFiles).length > 0;
    return false;
  });

  // @ts-expect-error -- mock returns string[] instead of Dirent[]
  vi.mocked(fs.readdirSync).mockImplementation((dir: fs.PathLike) => {
    const dirStr = String(dir);
    if (dirStr.includes('tutorials')) return Object.keys(tutorialFiles);
    if (dirStr.includes('blog')) return Object.keys(blogFiles);
    return [];
  });

  vi.mocked(fs.readFileSync).mockImplementation((filePath: fs.PathOrFileDescriptor) => {
    const fileStr = String(filePath);
    for (const [name, content] of Object.entries(tutorialFiles)) {
      if (fileStr.endsWith(name)) return content;
    }
    for (const [name, content] of Object.entries(blogFiles)) {
      if (fileStr.endsWith(name)) return content;
    }
    return '';
  });
}

describe('mdx-engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllTutorials', () => {
    it('parses and returns tutorials sorted by order', () => {
      setupMocks(
        {
          'getting-started.mdx': SAMPLE_TUTORIAL,
          'advanced-layouts.mdx': SAMPLE_TUTORIAL_2,
        },
        {}
      );

      const tutorials = getAllTutorials();
      expect(tutorials).toHaveLength(2);
      expect(tutorials[0].slug).toBe('getting-started');
      expect(tutorials[0].difficulty).toBe('beginner');
      expect(tutorials[0].content).toContain('Welcome to QuiltCorgi!');
      expect(tutorials[1].slug).toBe('advanced-layouts');
    });

    it('returns empty array when directory does not exist', () => {
      setupMocks({}, {});
      expect(getAllTutorials()).toHaveLength(0);
    });

    it('skips files with invalid frontmatter', () => {
      setupMocks(
        {
          'getting-started.mdx': SAMPLE_TUTORIAL,
          'broken.mdx': 'No frontmatter at all, just content',
        },
        {}
      );

      const tutorials = getAllTutorials();
      expect(tutorials).toHaveLength(1);
      expect(tutorials[0].slug).toBe('getting-started');
    });
  });

  describe('getTutorialBySlug', () => {
    it('returns matching tutorial', () => {
      setupMocks({ 'getting-started.mdx': SAMPLE_TUTORIAL }, {});
      const tutorial = getTutorialBySlug('getting-started');
      expect(tutorial).not.toBeNull();
      expect(tutorial?.title).toBe('Getting Started');
    });

    it('returns null for unknown slug', () => {
      setupMocks({ 'getting-started.mdx': SAMPLE_TUTORIAL }, {});
      expect(getTutorialBySlug('nonexistent')).toBeNull();
    });
  });

  describe('filterTutorialsByDifficulty', () => {
    it('filters by difficulty level', () => {
      setupMocks(
        {
          'getting-started.mdx': SAMPLE_TUTORIAL,
          'advanced-layouts.mdx': SAMPLE_TUTORIAL_2,
        },
        {}
      );

      const beginnerTutorials = filterTutorialsByDifficulty('beginner');
      expect(beginnerTutorials).toHaveLength(1);
      expect(beginnerTutorials[0].slug).toBe('getting-started');
    });
  });

  describe('getAllBlogPosts', () => {
    it('parses and returns posts sorted by date descending', () => {
      setupMocks(
        {},
        {
          'introducing.mdx': SAMPLE_BLOG_POST,
          'why-free.mdx': SAMPLE_BLOG_POST_2,
        }
      );

      const posts = getAllBlogPosts();
      expect(posts).toHaveLength(2);
      expect(posts[0].slug).toBe('why-free-tools');
      expect(posts[1].slug).toBe('introducing-quiltcorgi');
    });
  });

  describe('getBlogPostBySlug', () => {
    it('returns matching post', () => {
      setupMocks({}, { 'introducing.mdx': SAMPLE_BLOG_POST });
      const post = getBlogPostBySlug('introducing-quiltcorgi');
      expect(post).not.toBeNull();
      expect(post?.author).toBe('QuiltCorgi Team');
    });
  });

  describe('getBlogPostsByTag', () => {
    it('filters by tag case-insensitively', () => {
      setupMocks(
        {},
        {
          'introducing.mdx': SAMPLE_BLOG_POST,
          'why-free.mdx': SAMPLE_BLOG_POST_2,
        }
      );

      const launches = getBlogPostsByTag('Launch');
      expect(launches).toHaveLength(1);
      expect(launches[0].slug).toBe('introducing-quiltcorgi');
    });
  });

  describe('getAllBlogTags', () => {
    it('returns deduplicated sorted tags', () => {
      setupMocks(
        {},
        {
          'introducing.mdx': SAMPLE_BLOG_POST,
          'why-free.mdx': SAMPLE_BLOG_POST_2,
        }
      );

      const tags = getAllBlogTags();
      expect(tags).toEqual(['announcement', 'free', 'launch', 'philosophy']);
    });
  });

  describe('paginateBlogPosts', () => {
    it('returns correct page of posts', () => {
      setupMocks(
        {},
        {
          'introducing.mdx': SAMPLE_BLOG_POST,
          'why-free.mdx': SAMPLE_BLOG_POST_2,
        }
      );

      const result = paginateBlogPosts(1, 1);
      expect(result.posts).toHaveLength(1);
      expect(result.totalPages).toBe(2);
      expect(result.totalPosts).toBe(2);
    });
  });

  describe('searchContent', () => {
    it('searches across tutorials and blog posts', () => {
      setupMocks(
        { 'getting-started.mdx': SAMPLE_TUTORIAL },
        { 'introducing.mdx': SAMPLE_BLOG_POST }
      );

      const results = searchContent('quilt');
      expect(results.tutorials).toHaveLength(1);
      expect(results.blogPosts).toHaveLength(1);
    });

    it('returns empty results for no matches', () => {
      setupMocks(
        { 'getting-started.mdx': SAMPLE_TUTORIAL },
        { 'introducing.mdx': SAMPLE_BLOG_POST }
      );

      const results = searchContent('zzzznonexistent');
      expect(results.tutorials).toHaveLength(0);
      expect(results.blogPosts).toHaveLength(0);
    });
  });

  describe('generateRssFeed', () => {
    it('generates valid RSS XML', () => {
      setupMocks({}, { 'introducing.mdx': SAMPLE_BLOG_POST });
      const posts = getAllBlogPosts();
      const rss = generateRssFeed('https://quiltcorgi.com', posts);

      expect(rss).toContain('<?xml version="1.0"');
      expect(rss).toContain('<rss version="2.0"');
      expect(rss).toContain('<title><![CDATA[Introducing QuiltCorgi]]></title>');
      expect(rss).toContain('<link>https://quiltcorgi.com/blog/introducing-quiltcorgi</link>');
      expect(rss).toContain('<category>announcement</category>');
    });
  });
});
