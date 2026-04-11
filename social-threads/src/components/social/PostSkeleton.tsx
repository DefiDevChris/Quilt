'use client';

import { cn } from '@/lib/utils';

interface PostSkeletonProps {
  viewMode?: 'full' | 'grid';
}

export function PostSkeleton({ viewMode = 'full' }: PostSkeletonProps) {
  if (viewMode === 'grid') {
    return (
      <div className="bg-white rounded-2xl border border-[#e5d5c5] overflow-hidden shadow-sm">
        <div className="aspect-[4/3] bg-gradient-to-br from-[#fdfaf7] to-[#e5d5c5]/30 animate-pulse" />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[#e5d5c5]/50 animate-pulse" />
            <div className="flex-1">
              <div className="h-3 bg-[#e5d5c5]/50 rounded w-1/2 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-[#e5d5c5]/50 rounded w-full animate-pulse" />
            <div className="h-3 bg-[#e5d5c5]/50 rounded w-3/4 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e5d5c5] overflow-hidden shadow-sm">
      {/* Post Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#fdfaf7] to-[#e5d5c5]/50 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[#e5d5c5]/50 rounded w-1/4 animate-pulse" />
          <div className="h-3 bg-[#e5d5c5]/50 rounded w-1/3 animate-pulse" />
        </div>
      </div>

      {/* Post Content */}
      <div className="px-6 pb-6 space-y-4">
        <div className="space-y-2">
          <div className="h-3 bg-[#e5d5c5]/50 rounded w-full animate-pulse" />
          <div className="h-3 bg-[#e5d5c5]/50 rounded w-5/6 animate-pulse" />
          <div className="h-3 bg-[#e5d5c5]/50 rounded w-4/6 animate-pulse" />
        </div>

        <div className="flex gap-6">
          {/* Image - 2/3 */}
          <div className="w-2/3">
            <div className="h-80 rounded-xl bg-gradient-to-br from-[#fdfaf7] to-[#e5d5c5]/30 animate-pulse" />
          </div>

          {/* Comments - 1/3 */}
          <div className="w-1/3 space-y-4">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-[#e5d5c5]/50 rounded w-20 animate-pulse" />
              <div className="h-3 bg-[#e5d5c5]/50 rounded w-16 animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-[#e5d5c5]/50 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-[#e5d5c5]/50 rounded w-24 animate-pulse" />
                  <div className="h-3 bg-[#e5d5c5]/50 rounded w-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 pt-4 border-t border-[#e5d5c5]">
          <div className="h-4 bg-[#e5d5c5]/50 rounded w-20 animate-pulse" />
          <div className="h-4 bg-[#e5d5c5]/50 rounded w-24 animate-pulse" />
          <div className="h-4 bg-[#e5d5c5]/50 rounded w-16 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function CreatePostSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#e5d5c5] p-6 shadow-sm">
      <div className="flex gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#fdfaf7] to-[#e5d5c5]/50 animate-pulse" />
        <div className="flex-1 space-y-4">
          <div className="h-20 bg-[#fdfaf7] rounded-xl animate-pulse" />
          <div className="flex justify-between">
            <div className="flex gap-2">
              <div className="h-8 w-20 bg-[#e5d5c5]/50 rounded animate-pulse" />
              <div className="h-8 w-20 bg-[#e5d5c5]/50 rounded animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-gradient-to-r from-[#f9a06b]/50 to-[#ffc8a6]/50 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
