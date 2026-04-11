export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-6 space-y-8">
      {/* Header skeleton */}
      <div className="h-4 w-48 bg-neutral-200 rounded-full" />
      <div className="h-20 w-80 bg-neutral-200 rounded-full" />
      <div className="h-4 w-64 bg-neutral-200 rounded-full" />
      {/* Bento grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-40 bg-neutral-200 rounded-full border-2 border-neutral-800" />
        <div className="h-40 bg-neutral-200 rounded-full border-2 border-neutral-800" />
      </div>
    </div>
  );
}
