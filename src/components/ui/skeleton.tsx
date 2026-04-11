interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-[#e8e1da] rounded-lg ${className}`} />;
}

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`rounded-lg overflow-hidden bg-[#f5f2ef] ${className}`}>
      <div className="h-40 bg-[#e8e1da] animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-[#e8e1da] animate-pulse rounded-lg w-3/4" />
        <div className="h-3 bg-[#e8e1da] animate-pulse rounded-lg w-1/2" />
      </div>
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  columns?: number;
}

export function SkeletonGrid({ count = 6, columns = 3 }: SkeletonGridProps) {
  const colClass =
    columns === 2
      ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
      : columns === 4
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4';

  return (
    <div className={colClass}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

interface SkeletonRowProps {
  width?: string;
  height?: string;
}

export function SkeletonRow({ width = '100%', height = '16px' }: SkeletonRowProps) {
  return (
    <div style={{ width, height }} className="animate-pulse bg-[#e8e1da] rounded-lg" />
  );
}
