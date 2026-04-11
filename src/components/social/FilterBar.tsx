'use client';

import { Star, Clock, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode, FilterMode } from '@/types/social';

interface FilterBarProps {
  viewMode: ViewMode;
  filterMode: FilterMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterModeChange: (mode: FilterMode) => void;
}

export function FilterBar({ viewMode, filterMode, onViewModeChange, onFilterModeChange }: FilterBarProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFilterModeChange('featured')}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium',
              filterMode === 'featured'
                ? 'bg-[#ff8d49] text-white'
                : 'text-[var(--color-text-dim)] hover:bg-[var(--color-bg)]'
            )}
          >
            <Star className="h-4 w-4" />
            Featured
          </button>
          <button
            onClick={() => onFilterModeChange('newest')}
            className={cn(
              'flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium',
              filterMode === 'newest'
                ? 'bg-[#ff8d49] text-white'
                : 'text-[var(--color-text-dim)] hover:bg-[var(--color-bg)]'
            )}
          >
            <Clock className="h-4 w-4" />
            Newest
          </button>
        </div>

        <div className="flex items-center gap-0.5 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full p-1">
          <button
            onClick={() => onViewModeChange('full')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium',
              viewMode === 'full'
                ? 'bg-white text-[#ff8d49] shadow-sm'
                : 'text-[var(--color-text-dim)]'
            )}
          >
            <List className="h-4 w-4" />
            Full
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium',
              viewMode === 'grid'
                ? 'bg-white text-[#ff8d49] shadow-sm'
                : 'text-[var(--color-text-dim)]'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Grid
          </button>
        </div>
      </div>
    </div>
  );
}
