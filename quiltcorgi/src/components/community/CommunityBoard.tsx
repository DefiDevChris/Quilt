'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { CommunityCard } from '@/components/community/CommunityCard';
import { FeedTabs } from '@/components/community/FeedTabs';
import { CategoryFilter } from '@/components/community/CategoryFilter';
import Link from 'next/link';

export function CommunityBoard() {
  const user = useAuthStore((s) => s.user);
  const posts = useCommunityStore((s) => s.posts);
  const search = useCommunityStore((s) => s.search);
  const sort = useCommunityStore((s) => s.sort);
  const tab = useCommunityStore((s) => s.tab);
  const category = useCommunityStore((s) => s.category);
  const page = useCommunityStore((s) => s.page);
  const totalPages = useCommunityStore((s) => s.totalPages);
  const isLoading = useCommunityStore((s) => s.isLoading);
  const error = useCommunityStore((s) => s.error);
  const setSearch = useCommunityStore((s) => s.setSearch);
  const setSort = useCommunityStore((s) => s.setSort);
  const setTab = useCommunityStore((s) => s.setTab);
  const setCategory = useCommunityStore((s) => s.setCategory);
  const fetchPosts = useCommunityStore((s) => s.fetchPosts);
  const loadMore = useCommunityStore((s) => s.loadMore);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialFetchDone = useRef(false);

  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchPosts();
    }
  }, [fetchPosts]);

  const handleSearchChange = useCallback(
    (value: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        setSearch(value);
      }, 300);
    },
    [setSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-4">Community Quilts</h1>

      {/* Feed Tabs */}
      <FeedTabs activeTab={tab} onTabChange={setTab} isLoggedIn={!!user} />

      {/* Category Filter */}
      <CategoryFilter activeCategory={category} onCategoryChange={setCategory} />

      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="flex-1 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search designs..."
            defaultValue={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full max-w-md rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSort('newest')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              sort === 'newest'
                ? 'bg-primary text-primary-on'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Newest
          </button>
          <button
            type="button"
            onClick={() => setSort('popular')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              sort === 'popular'
                ? 'bg-primary text-primary-on'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            Most Liked
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && posts.length === 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-4 break-inside-avoid">
              <div className="rounded-lg bg-surface-container overflow-hidden animate-pulse">
                <div className="w-full aspect-[4/3] bg-surface-container-high" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-surface-container-high rounded w-3/4" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-16">
          <p className="text-secondary mb-4">{error}</p>
          <button
            type="button"
            onClick={() => fetchPosts()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && posts.length === 0 && (
        <div className="text-center py-16">
          <p className="text-secondary mb-2">No designs shared yet.</p>
          <p className="text-sm text-secondary">Be the first!</p>
        </div>
      )}

      {/* Masonry Grid */}
      {posts.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
          {posts.map((post) => (
            <div key={post.id} className="mb-4 break-inside-avoid">
              <CommunityCard post={post} />
            </div>
          ))}
        </div>
      )}

      {/* Load More */}
      {page < totalPages && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={isLoading}
            className="rounded-md bg-surface-container px-6 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* New Post FAB */}
      {user && (
        <Link
          href="/community/new"
          className="fixed bottom-6 right-6 hidden md:flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-on shadow-elevation-3 hover:shadow-elevation-4 transition-shadow z-40"
          title="New Post"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </Link>
      )}
    </div>
  );
}
