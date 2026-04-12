export function PostSkeleton({ viewMode = 'full' }: { viewMode?: 'full' | 'grid' }) {
  if (viewMode === 'grid') {
    return (
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
        <div className="aspect-[4/3] bg-[var(--color-border)]/30 animate-pulse" />
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-[var(--color-border)]/30 animate-pulse" />
            <div className="h-3 bg-[var(--color-border)]/30 rounded-full w-20 animate-pulse" />
          </div>
          <div className="h-3 bg-[var(--color-border)]/30 rounded w-full animate-pulse" />
          <div className="h-3 bg-[var(--color-border)]/30 rounded w-3/4 animate-pulse" />
        </div>
      </div>
    );
  }
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 p-6 pb-4">
        <div className="h-12 w-12 rounded-full bg-[var(--color-border)]/30 animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-[var(--color-border)]/30 rounded-full w-28 animate-pulse" />
          <div className="h-3 bg-[var(--color-border)]/30 rounded-full w-20 animate-pulse" />
        </div>
      </div>
      <div className="px-6 pb-4 space-y-2">
        <div className="h-4 bg-[var(--color-border)]/30 rounded w-full animate-pulse" />
        <div className="h-4 bg-[var(--color-border)]/30 rounded w-5/6 animate-pulse" />
      </div>
      <div className="px-6 pb-5">
        <div className="flex gap-5">
          <div className="w-2/3 h-80 bg-[var(--color-border)]/30 rounded-lg animate-pulse" />
          <div className="w-1/3 space-y-3">
            <div className="h-3 bg-[var(--color-border)]/30 rounded-full w-16 animate-pulse" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-2.5">
                <div className="h-8 w-8 rounded-full bg-[var(--color-border)]/30 animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-2.5 bg-[var(--color-border)]/30 rounded-full w-20 animate-pulse" />
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
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-5">
      <div className="flex gap-3">
        <div className="h-12 w-12 rounded-full bg-[var(--color-border)]/30 animate-pulse" />
        <div className="flex-1 space-y-3">
          <div className="h-20 bg-[var(--color-bg)] rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
