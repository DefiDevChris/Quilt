'use client';

import { cn } from '@/lib/utils';

interface LoadingShimmerProps {
  className?: string;
}

export function LoadingShimmer({ className }: LoadingShimmerProps) {
  return (
    <div className={cn("animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] rounded-lg", className)} />
  );
}

export function PostCardSkeleton({ viewMode = 'full' }: { viewMode?: 'full' | 'grid' }) {
  if (viewMode === 'grid') {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm animate-fadeIn">
        {/* Image Placeholder */}
        <LoadingShimmer className="aspect-[4/3] w-full" />
        
        <div className="p-4 space-y-3">
          {/* User Info */}
          <div className="flex items-center gap-2">
            <LoadingShimmer className="h-8 w-8 rounded-full" />
            <LoadingShimmer className="h-4 w-24" />
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <LoadingShimmer className="h-3 w-full" />
            <LoadingShimmer className="h-3 w-3/4" />
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <LoadingShimmer className="h-6 w-16 rounded-lg" />
            <LoadingShimmer className="h-6 w-12 rounded-lg" />
            <LoadingShimmer className="h-6 w-12 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 p-6 pb-4">
        <LoadingShimmer className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <LoadingShimmer className="h-4 w-32" />
          <LoadingShimmer className="h-3 w-24" />
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6 space-y-4">
        <div className="space-y-2">
          <LoadingShimmer className="h-3 w-full" />
          <LoadingShimmer className="h-3 w-5/6" />
          <LoadingShimmer className="h-3 w-4/6" />
        </div>

        {/* Image + Comments */}
        <div className="flex gap-6">
          <div className="w-2/3">
            <LoadingShimmer className="h-80 rounded-xl" />
          </div>
          <div className="w-1/3 space-y-4">
            <LoadingShimmer className="h-4 w-20" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <LoadingShimmer className="h-8 w-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <LoadingShimmer className="h-3 w-24" />
                  <LoadingShimmer className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 pt-4">
          <LoadingShimmer className="h-5 w-20" />
          <LoadingShimmer className="h-5 w-24" />
          <LoadingShimmer className="h-5 w-16" />
        </div>
      </div>
    </div>
  );
}

export function TrendingSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <LoadingShimmer className="h-8 w-8 rounded-lg" />
        <LoadingShimmer className="h-5 w-32" />
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <LoadingShimmer className="h-12 w-12 rounded-xl" />
            <div className="flex-1 space-y-2">
              <LoadingShimmer className="h-4 w-3/4" />
              <LoadingShimmer className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivitySkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <LoadingShimmer className="h-8 w-8 rounded-lg" />
        <LoadingShimmer className="h-5 w-28" />
      </div>
      
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2">
            <LoadingShimmer className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <LoadingShimmer className="h-3 w-3/4" />
              <LoadingShimmer className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StoriesSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-3">
        <LoadingShimmer className="h-4 w-16" />
        <LoadingShimmer className="h-3 w-12" />
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
            <LoadingShimmer className="h-16 w-16 rounded-full" />
            <LoadingShimmer className="h-3 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CreatePostSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm animate-fadeIn">
      <div className="flex gap-4">
        <LoadingShimmer className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-4">
          <LoadingShimmer className="h-20 w-full rounded-xl" />
          <div className="flex justify-between">
            <div className="flex gap-2">
              <LoadingShimmer className="h-8 w-20 rounded-lg" />
              <LoadingShimmer className="h-8 w-20 rounded-lg" />
            </div>
            <LoadingShimmer className="h-8 w-16 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProfileCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm animate-fadeIn">
      <div className="flex flex-col items-center text-center space-y-4">
        <LoadingShimmer className="h-24 w-24 rounded-full" />
        <div className="space-y-2">
          <LoadingShimmer className="h-6 w-32" />
          <LoadingShimmer className="h-4 w-24" />
        </div>
        <LoadingShimmer className="h-10 w-full rounded-xl" />
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3].map((i) => (
            <div key={i} className="text-center space-y-1">
              <LoadingShimmer className="h-5 w-8 mx-auto" />
              <LoadingShimmer className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
