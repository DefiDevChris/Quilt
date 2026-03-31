'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePatternStore } from '@/stores/patternStore';
import { SKILL_LEVELS, SKILL_LEVEL_LABELS } from '@/lib/constants';
import { PatternCard } from '@/components/patterns/PatternCard';
import { PatternDetailDialog } from '@/components/patterns/PatternDetailDialog';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popular' },
  { value: 'name', label: 'A-Z' },
  { value: 'newest', label: 'Newest' },
] as const;

const DEBOUNCE_MS = 300;

function SkeletonCard() {
  return (
    <div
      className="rounded-[var(--radius-lg)] overflow-hidden animate-pulse"
      style={{
        backgroundColor: 'var(--color-surface-container-low)',
        boxShadow: 'var(--shadow-elevation-1)',
      }}
    >
      <div className="aspect-[3/2]" style={{ backgroundColor: 'var(--color-surface-container)' }} />
      <div className="px-4 pt-3 pb-4 space-y-2.5">
        <div
          className="h-4 rounded w-3/4"
          style={{ backgroundColor: 'var(--color-surface-container-high)' }}
        />
        <div
          className="h-5 rounded-full w-20"
          style={{ backgroundColor: 'var(--color-surface-container-high)' }}
        />
        <div
          className="h-3 rounded w-1/2"
          style={{ backgroundColor: 'var(--color-surface-container-high)' }}
        />
        <div
          className="h-3 rounded w-2/5"
          style={{ backgroundColor: 'var(--color-surface-container-high)' }}
        />
      </div>
    </div>
  );
}

export function PatternLibrary() {
  const router = useRouter();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patterns = usePatternStore((s) => s.patterns);
  const isLoading = usePatternStore((s) => s.isLoading);
  const error = usePatternStore((s) => s.error);
  const filters = usePatternStore((s) => s.filters);
  const pagination = usePatternStore((s) => s.pagination);
  const upgradeRequired = usePatternStore((s) => s.upgradeRequired);
  const fetchPatterns = usePatternStore((s) => s.fetchPatterns);
  const setFilter = usePatternStore((s) => s.setFilter);
  const setPage = usePatternStore((s) => s.setPage);
  const clearError = usePatternStore((s) => s.clearError);

  useEffect(() => {
    fetchPatterns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        setFilter('search', value);
      }, DEBOUNCE_MS);
    },
    [setFilter]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSkillFilter = useCallback(
    (level: string | null) => {
      setFilter('skillLevel', level);
    },
    [setFilter]
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilter('sort', e.target.value);
    },
    [setFilter]
  );

  const handleResetFilters = useCallback(() => {
    setSearchInput('');
    setFilter('search', '');
    setFilter('skillLevel', null);
    setFilter('sort', 'popular');
  }, [setFilter]);

  const handlePreview = useCallback((id: string) => {
    setPreviewId(id);
  }, []);

  const handleClosePreview = useCallback(() => {
    setPreviewId(null);
  }, []);

  const handleImportSuccess = useCallback(
    (projectId: string) => {
      router.push(`/studio/${projectId}`);
    },
    [router]
  );

  const hasResults = patterns.length > 0;
  const showEmptyState = !isLoading && !hasResults && !error;
  const showProGate = upgradeRequired && hasResults;

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
            style={{ color: 'var(--color-secondary)' }}
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchChange}
            placeholder="Search patterns..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-[var(--radius-md)] outline-none transition-colors"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              color: 'var(--color-on-surface)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-container-high)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface-container)';
            }}
          />
        </div>
      </div>

      {/* Filter Bar + Sort */}
      <div className="flex items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6 flex-wrap">
        {/* Skill level chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleSkillFilter(null)}
            className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer"
            style={{
              backgroundColor:
                filters.skillLevel === null
                  ? 'var(--color-primary-container)'
                  : 'var(--color-surface-container)',
              color:
                filters.skillLevel === null
                  ? 'var(--color-primary-on-container)'
                  : 'var(--color-secondary)',
            }}
          >
            All
          </button>
          {SKILL_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => handleSkillFilter(level)}
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors cursor-pointer"
              style={{
                backgroundColor:
                  filters.skillLevel === level
                    ? 'var(--color-primary-container)'
                    : 'var(--color-surface-container)',
                color:
                  filters.skillLevel === level
                    ? 'var(--color-primary-on-container)'
                    : 'var(--color-secondary)',
              }}
            >
              {SKILL_LEVEL_LABELS[level]}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={filters.sort}
          onChange={handleSortChange}
          className="text-xs font-medium rounded-[var(--radius-sm)] px-3 py-1.5 outline-none cursor-pointer"
          style={{
            backgroundColor: 'var(--color-surface-container)',
            color: 'var(--color-on-surface)',
          }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-10">
          <p className="text-sm mb-3" style={{ color: 'var(--color-error)' }}>
            {error}
          </p>
          <button
            type="button"
            onClick={() => {
              clearError();
              fetchPatterns();
            }}
            className="text-sm font-medium px-4 py-2 rounded-[var(--radius-md)] transition-opacity hover:opacity-90 cursor-pointer"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-on)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !hasResults && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {showEmptyState && (
        <div className="text-center py-16">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: 'var(--color-surface-container-highest)' }}
          >
            <path
              fillRule="evenodd"
              d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-on-surface)' }}>
            No patterns match your filters
          </p>
          <p className="text-xs mb-4" style={{ color: 'var(--color-secondary)' }}>
            Try adjusting your search or skill level filter.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-medium px-4 py-2 rounded-[var(--radius-md)] transition-opacity hover:opacity-90 cursor-pointer"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              color: 'var(--color-on-surface)',
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Pattern Grid */}
      {hasResults && (
        <div className="relative">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
            {patterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} onPreview={handlePreview} />
            ))}
          </div>

          {/* Pro gate overlay */}
          {showProGate && (
            <div
              className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-12 pt-32"
              style={{
                top: '200px',
                background:
                  'linear-gradient(to bottom, transparent 0%, var(--color-surface-container-low) 30%, var(--color-surface-container-low) 100%)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
              }}
            >
              <div className="text-center">
                <p
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--color-on-surface)' }}
                >
                  Upgrade to Pro to access 70+ quilt patterns
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--color-secondary)' }}>
                  Unlock the full pattern library with a Pro subscription.
                </p>
                <a
                  href="/profile#billing"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-[var(--radius-md)] transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-on)',
                  }}
                >
                  View Plans
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {hasResults && pagination.totalPages > 1 && !showProGate && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            type="button"
            onClick={() => setPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="text-xs font-medium px-4 py-2 rounded-[var(--radius-sm)] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              color: 'var(--color-on-surface)',
            }}
          >
            Previous
          </button>
          <span
            className="text-xs font-medium tabular-nums"
            style={{ color: 'var(--color-secondary)' }}
          >
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="text-xs font-medium px-4 py-2 rounded-[var(--radius-sm)] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            style={{
              backgroundColor: 'var(--color-surface-container)',
              color: 'var(--color-on-surface)',
            }}
          >
            Next
          </button>
        </div>
      )}

      {/* Pattern Detail Dialog */}
      <PatternDetailDialog
        patternId={previewId}
        onClose={handleClosePreview}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
