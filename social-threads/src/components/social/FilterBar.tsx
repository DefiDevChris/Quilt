'use client';

import { Star, Clock, Square, Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewMode, FilterMode } from '@/types/social';

interface FilterBarProps {
  viewMode: ViewMode;
  filterMode: FilterMode;
  onViewModeChange: (mode: ViewMode) => void;
  onFilterModeChange: (mode: FilterMode) => void;
}

export function FilterBar({
  viewMode,
  filterMode,
  onViewModeChange,
  onFilterModeChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#e5d5c5] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Filter Options */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onFilterModeChange('featured')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium",
              filterMode === 'featured'
                ? "bg-primary text-white"
                : "text-gray-600"
            )}
          >
            <Star className={cn("h-4 w-4", filterMode === 'featured' && "fill-current")} />
            Featured
          </button>
          <button
            onClick={() => onFilterModeChange('newest')}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium",
              filterMode === 'newest'
                ? "bg-primary text-white"
                : "text-gray-600"
            )}
          >
            <Clock className="h-4 w-4" />
            Newest
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-[#fdfaf7] rounded-full border border-[#e5d5c5]">
          <button
            onClick={() => onViewModeChange('full')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              viewMode === 'full'
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500"
            )}
          >
            <Square className="h-4 w-4" />
            Full
          </button>
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium",
              viewMode === 'grid'
                ? "bg-white text-primary shadow-sm"
                : "text-gray-500"
            )}
          >
            <Grid3X3 className="h-4 w-4" />
            Grid
          </button>
        </div>
      </div>
    </div>
  );
}
