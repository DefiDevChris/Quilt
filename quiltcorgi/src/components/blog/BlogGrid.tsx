'use client';

import { useState, useMemo } from 'react';
import { BlogCard } from '@/components/blog/BlogCard';
import type { BlogFrontmatter } from '@/lib/mdx-schemas';

const POSTS_PER_PAGE = 6;

interface BlogGridProps {
  readonly initialPosts: readonly BlogFrontmatter[];
  readonly allTags: readonly string[];
}

export function BlogGrid({ initialPosts, allTags }: BlogGridProps) {
  const [activeTags, setActiveTags] = useState<ReadonlySet<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
    setVisibleCount(POSTS_PER_PAGE);
  };

  const filtered = useMemo(() => {
    if (activeTags.size === 0) return initialPosts;
    return initialPosts.filter((post) =>
      post.tags.some((tag) => activeTags.has(tag))
    );
  }, [initialPosts, activeTags]);

  const visiblePosts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div>
      {/* Tag Filter Pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                activeTags.has(tag)
                  ? 'bg-primary text-primary-on'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
              }`}
            >
              {tag}
            </button>
          ))}
          {activeTags.size > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags(new Set())}
              className="text-sm text-secondary hover:text-on-surface transition-colors underline underline-offset-2"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Posts Grid */}
      {visiblePosts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-secondary">No posts match the selected tags.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visiblePosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
            className="rounded-md bg-surface-container px-6 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
