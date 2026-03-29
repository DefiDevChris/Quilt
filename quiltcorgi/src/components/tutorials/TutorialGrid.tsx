'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { TutorialCard } from '@/components/tutorials/TutorialCard';
import { TutorialCarousel } from '@/components/tutorials/TutorialCarousel';
import type { TutorialFrontmatter } from '@/lib/mdx-schemas';

type Difficulty = TutorialFrontmatter['difficulty'];

const DIFFICULTY_OPTIONS: readonly { readonly value: Difficulty | 'all'; readonly label: string }[] = [
  { value: 'all', label: 'All Tutorials' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
] as const;

interface TutorialGridProps {
  readonly tutorials: readonly TutorialFrontmatter[];
}

export function TutorialGrid({ tutorials }: TutorialGridProps) {
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 300);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const filtered = tutorials.filter((tutorial) => {
    const matchesDifficulty = difficulty === 'all' || tutorial.difficulty === difficulty;
    const lowerSearch = debouncedSearch.toLowerCase();
    const matchesSearch =
      lowerSearch === '' ||
      tutorial.title.toLowerCase().includes(lowerSearch) ||
      tutorial.description.toLowerCase().includes(lowerSearch) ||
      tutorial.tags.some((tag) => tag.toLowerCase().includes(lowerSearch));
    return matchesDifficulty && matchesSearch;
  });

  // Get featured tutorials (first 3 or first 3 of filtered)
  const featuredTutorials = difficulty === 'all' && debouncedSearch === ''
    ? tutorials.slice(0, 3)
    : filtered.slice(0, 3);

  const remainingTutorials = difficulty === 'all' && debouncedSearch === ''
    ? tutorials.slice(3)
    : filtered.slice(3);

  const allFilteredTutorials = filtered;

  return (
    <div className="space-y-12">
      {/* Featured Carousel Section */}
      {featuredTutorials.length > 0 && difficulty === 'all' && debouncedSearch === '' && (
        <section className="mb-16">
          <TutorialCarousel tutorials={featuredTutorials} />
        </section>
      )}

      {/* Search and Filter Section */}
      <section className="bg-surface-container/50 rounded-2xl p-6 border border-outline-variant/30">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search tutorials..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-outline-variant 
                       bg-surface text-on-surface placeholder:text-secondary 
                       focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                       transition-all"
            />
            {search && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full 
                         bg-surface-container-high hover:bg-surface-container-highest 
                         flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {DIFFICULTY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setDifficulty(option.value)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${difficulty === option.value
                    ? 'bg-primary text-primary-on shadow-md'
                    : 'bg-surface text-secondary hover:bg-surface-container-high border border-outline-variant/50'
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 flex items-center gap-2 text-body-sm text-secondary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>
            Showing <strong className="text-on-surface">{filtered.length}</strong> tutorial
            {filtered.length !== 1 && 's'}
          </span>
        </div>
      </section>

      {/* All Tutorials - Horizontal Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-container-high flex items-center justify-center">
            <svg
              className="w-10 h-10 text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-headline-sm font-semibold text-on-surface mb-2">
            No tutorials found
          </h3>
          <p className="text-body-md text-secondary">
            Try adjusting your search or filter to find what you&apos;re looking for.
          </p>
        </div>
      ) : (
        <section>
          {(difficulty !== 'all' || debouncedSearch !== '') && (
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-label-lg font-semibold text-secondary uppercase tracking-wider">
                {difficulty !== 'all' ? `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Tutorials` : 'Search Results'}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-outline-variant to-transparent"></div>
            </div>
          )}
          
          <div className="space-y-6">
            {(difficulty === 'all' && debouncedSearch === '' ? remainingTutorials : allFilteredTutorials).map((tutorial) => (
              <TutorialCard key={tutorial.slug} tutorial={tutorial} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
