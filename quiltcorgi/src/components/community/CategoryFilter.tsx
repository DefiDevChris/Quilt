'use client';

import type { CommunityCategory } from '@/types/community';

interface CategoryFilterProps {
  activeCategory: CommunityCategory | undefined;
  onCategoryChange: (category: CommunityCategory | undefined) => void;
}

const CATEGORIES: ReadonlyArray<{ id: CommunityCategory | undefined; label: string }> = [
  { id: undefined, label: 'All' },
  { id: 'show-and-tell', label: 'Show & Tell' },
  { id: 'wip', label: 'Work in Progress' },
  { id: 'help', label: 'Help' },
  { id: 'inspiration', label: 'Inspiration' },
  { id: 'general', label: 'General' },
];

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-none">
      {CATEGORIES.map((cat) => {
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id ?? 'all'}
            type="button"
            onClick={() => onCategoryChange(cat.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-container text-primary'
                : 'bg-surface-container text-secondary hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
