'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { TutorialCard } from '@/components/tutorials/TutorialCard';
import type { TutorialFrontmatter } from '@/lib/mdx-schemas';

type Difficulty = TutorialFrontmatter['difficulty'];

const DIFFICULTY_OPTIONS: readonly { readonly value: Difficulty | 'all'; readonly label: string }[] = [
  { value: 'all', label: 'All' },
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

  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search tutorials..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full max-w-md rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Difficulty Filter Chips */}
      <div className="flex items-center gap-2 mb-6">
        {DIFFICULTY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setDifficulty(option.value)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              difficulty === option.value
                ? 'bg-primary text-primary-on'
                : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Tutorial Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-secondary">No tutorials match your filters.</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {filtered.map((tutorial) => (
            <div key={tutorial.slug} className="mb-4 break-inside-avoid">
              <TutorialCard tutorial={tutorial} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
