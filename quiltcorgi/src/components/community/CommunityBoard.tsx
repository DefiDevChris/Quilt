'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';
import { ModernCommunityCard } from '@/components/community/ModernCommunityCard';
import { SocialThreadsSidebar } from '@/components/community/SocialThreadsSidebar';
import { SocialThreadsHeader } from '@/components/community/SocialThreadsHeader';
import { FeedTabs } from '@/components/community/FeedTabs';
import { CategoryFilter } from '@/components/community/CategoryFilter';
import Link from 'next/link';
import Mascot from '@/components/landing/Mascot';

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
    <div className="min-h-screen bg-background">
      <SocialThreadsHeader />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <SocialThreadsSidebar />

          {/* Main Feed */}
          <main className="flex-1 min-w-0">
            {/* Welcome / Create Post */}
            {user && (
              <div className="bg-background rounded-2xl border border-outline-variant p-4 mb-6">
                <div className="flex items-center gap-3">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {user.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <Link
                    href="/dashboard"
                    className="flex-1 bg-surface-container rounded-full px-5 py-2.5 text-secondary hover:bg-surface-container-high transition-colors text-left"
                  >
                    Share your latest quilt design...
                  </Link>
                </div>
              </div>
            )}

            {/* Feed Tabs & Filters */}
            <div className="bg-background rounded-2xl border border-outline-variant p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <FeedTabs activeTab={tab} onTabChange={setTab} isLoggedIn={!!user} />

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                      />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search designs..."
                      defaultValue={search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="w-full sm:w-56 pl-10 pr-4 py-2 rounded-full bg-surface-container text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 border-none"
                    />
                  </div>

                  <div className="flex items-center bg-surface-container rounded-full p-1">
                    <SortButton active={sort === 'newest'} onClick={() => setSort('newest')}>
                      New
                    </SortButton>
                    <SortButton active={sort === 'popular'} onClick={() => setSort('popular')}>
                      Top
                    </SortButton>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-outline-variant">
                <CategoryFilter activeCategory={category} onCategoryChange={setCategory} />
              </div>
            </div>

            {/* Loading State */}
            {isLoading && posts.length === 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-background rounded-2xl border border-outline-variant overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-surface-container-high" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-surface-container-high rounded-full w-3/4" />
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-surface-container-high" />
                        <div className="h-3 bg-surface-container-high rounded-full w-24" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-16 bg-background rounded-2xl border border-outline-variant">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error-container flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-error"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                    />
                  </svg>
                </div>
                <p className="text-secondary mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchPosts()}
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-on hover:opacity-90 transition-opacity"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && posts.length === 0 && (
              <div className="text-center py-16 bg-background rounded-2xl border border-outline-variant">
                <div className="w-20 h-20 mx-auto mb-4">
                  <Mascot pose="sitting" size="lg" />
                </div>
                <p className="text-lg font-semibold text-on-surface mb-2">No designs yet</p>
                <p className="text-secondary mb-6">Be the first to share your quilt!</p>
                {user && (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-on hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Share Your Design
                  </Link>
                )}
              </div>
            )}

            {/* Posts Grid */}
            {posts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => (
                  <ModernCommunityCard key={post.id} post={post} />
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
                  className="rounded-full bg-surface-container px-8 py-3 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </main>

          {/* Right Sidebar - Suggestions */}
          <aside className="w-80 hidden xl:block sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto">
            <TrendingSection />
            <SuggestedQuilters />
          </aside>
        </div>
      </div>
    </div>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
        active ? 'bg-background text-on-surface shadow-sm' : 'text-secondary hover:text-on-surface'
      }`}
    >
      {children}
    </button>
  );
}

function TrendingSection() {
  return (
    <div className="bg-background rounded-2xl border border-outline-variant p-4 mb-4">
      <h3 className="font-semibold text-on-surface mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
          />
        </svg>
        Trending
      </h3>
      <p className="text-sm text-secondary">Trending topics coming soon.</p>
    </div>
  );
}

function SuggestedQuilters() {
  return (
    <div className="bg-background rounded-2xl border border-outline-variant p-4">
      <h3 className="font-semibold text-on-surface mb-4">Suggested Quilters</h3>
      <p className="text-sm text-secondary">Suggested quilters coming soon.</p>
    </div>
  );
}
