'use client';

import { useState, useEffect, useCallback } from 'react';
import { BlogCard } from '@/components/blog/BlogCard';
import type { BlogPostListItem } from '@/types/community';

interface BlogGridProps {
  readonly initialPosts: readonly BlogPostListItem[];
  readonly initialTotal: number;
  readonly initialCategory?: string;
}

export function BlogGrid({ initialPosts, initialTotal, initialCategory }: BlogGridProps) {
  const [posts, setPosts] = useState<readonly BlogPostListItem[]>(initialPosts);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(total / 10);

  const fetchPosts = useCallback(async (pageNum: number, searchTerm: string, cat: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pageNum));
      if (searchTerm) params.set('search', searchTerm);
      if (cat) params.set('category', cat);

      const res = await fetch(`/api/blog?${params.toString()}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setPosts(json.data.posts);
        setTotal(json.data.pagination.total);
      }
    } catch {
      // Keep existing state on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSearch = useCallback(() => {
    setPage(1);
    fetchPosts(1, search, category);
  }, [search, category, fetchPosts]);

  const handleCategoryChange = useCallback(
    (newCategory: string) => {
      const cat = newCategory === category ? '' : newCategory;
      setCategory(cat);
      setPage(1);
      fetchPosts(1, search, cat);
    },
    [category, search, fetchPosts]
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      fetchPosts(newPage, search, category);
    },
    [search, category, fetchPosts]
  );

  // Sync when initial props change (SSR)
  useEffect(() => {
    setPosts(initialPosts);
    setTotal(initialTotal);
  }, [initialPosts, initialTotal]);

  const categories = [
    'Tutorials',
    'Tips & Tricks',
    'Community',
    'Product Updates',
    'Inspiration',
    'Behind the Scenes',
  ];

  return (
    <div>
      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          placeholder="Search blog posts..."
          className="flex-1 rounded-lg border border-outline-variant/30 bg-surface px-4 py-2.5 text-sm text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => handleCategoryChange(cat)}
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              category === cat
                ? 'bg-primary text-primary-on'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {cat}
          </button>
        ))}
        {category && (
          <button
            type="button"
            onClick={() => handleCategoryChange('')}
            className="text-sm text-secondary hover:text-on-surface transition-colors underline underline-offset-2"
          >
            Clear filter
          </button>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 bg-surface-container rounded-lg animate-pulse" />
          ))}
        </div>
      )}

      {/* Posts Grid */}
      {!isLoading && posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-secondary">No blog posts found.</p>
        </div>
      )}

      {!isLoading && posts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            type="button"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-md bg-surface-container px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-secondary px-3">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-md bg-surface-container px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
