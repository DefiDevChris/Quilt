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

export function FilterBar({ viewMode, filterMode, onViewModeChange, onFilterModeChange }: FilterBarProps) {
  return (
    <div className="flex items-center justify-between bg-white border border-[#e8e1da] rounded-2xl shadow-sm px-4 py-2.5">
      <div className="flex items-center gap-1">
        <button
          onClick={() => onFilterModeChange('featured')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium",
            filterMode === 'featured'
              ? "bg-[#ff8d49] text-white"
              : "text-[#6b655e] hover:bg-gray-50"
          )}
        >
          <Star className="h-3.5 w-3.5" />
          Featured
        </button>
        <button
          onClick={() => onFilterModeChange('newest')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium",
            filterMode === 'newest'
              ? "bg-[#ff8d49] text-white"
              : "text-[#6b655e] hover:bg-gray-50"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Newest
        </button>
      </div>

      <div className="flex items-center gap-0.5 border border-[#e8e1da] rounded-full p-0.5">
        <button
          onClick={() => onViewModeChange('full')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
            viewMode === 'full'
              ? "bg-[#ff8d49] text-white"
              : "text-[#6b655e]"
          )}
        >
          <Square className="h-3.5 w-3.5" />
          Full
        </button>
        <button
          onClick={() => onViewModeChange('grid')}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
            viewMode === 'grid'
              ? "bg-[#ff8d49] text-white"
              : "text-[#6b655e]"
          )}
        >
          <Grid3X3 className="h-3.5 w-3.5" />
          Grid
        </button>
      </div>
    </div>
  );
}
