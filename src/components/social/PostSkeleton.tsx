'use client';

import { cn } from '@/lib/utils';

export function PostSkeleton({ viewMode = 'full' }: { viewMode?: 'full' | 'grid' }) {
  if (viewMode === 'grid') {
    return (
      <div className="bg-[#ffffff] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="aspect-[4/3] bg-[var(--color-border)]/30 animate-pulse rounded-t-lg" />
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[var(--color-border)]/30 animate-pulse" />
            <div className="h-3 bg-[var(--color-border)]/30 rounded w-20 animate-pulse" />
          </div>
          <div className="h-3 bg-[var(--color-border)]/30 rounded w-full animate-pulse" />
          <div className="h-3 bg-[var(--color-border)]/30 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[#ffffff] border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-5 pb-3">
        <div className="h-10 w-10 rounded-full bg-[var(--color-border)]/30 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-[var(--color-border)]/30 rounded w-24 animate-pulse" />
          <div className="h-2.5 bg-[var(--color-border)]/30 rounded w-16 animate-pulse" />
        </div>
      </div>
      <div className="px-5 pb-3 space-y-2">
        <div className="h-3 bg-[var(--color-border)]/30 rounded w-full animate-pulse" />
        <div className="h-3 bg-[var(--color-border)]/30 rounded w-5/6 animate-pulse" />
      </div>
      <div className="px-5 pb-4">
        <div className="flex gap-5">
          <div className="w-2/3 h-64 bg-[var(--color-border)]/30 rounded-lg animate-pulse" />
          <div className="w-1/3 space-y-3">
            <div className="h-3 bg-[var(--color-border)]/30 rounded w-16 animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2">
                <div className="h-7 w-7 rounded-full bg-[var(--color-border)]/30 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-[var(--color-border)]/30 rounded w-20 animate-pulse" />
                  <div className="h-2 bg-[var(--color-border)]/30 rounded w-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CreatePostSkeleton() {
  return (
    <div className="bg-[#ffffff] border border-[var(--color-border)] rounded-lg p-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-[var(--color-border)]/30 animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-14 bg-[var(--color-border)]/30 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
