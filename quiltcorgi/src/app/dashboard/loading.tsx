export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-2 space-y-2">
      {/* Header */}
      <div className="h-6 w-36 bg-white/40 rounded-full" />
      {/* Bento grid skeleton */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-7 row-span-2 h-48 bg-white/40 rounded-xl" />
        <div className="col-span-5 h-48 bg-white/40 rounded-xl" />
        <div className="col-span-5 h-48 bg-white/40 rounded-xl" />
        <div className="col-span-3 h-32 bg-white/40 rounded-xl" />
        <div className="col-span-2 h-32 bg-white/40 rounded-xl" />
        <div className="col-span-2 h-32 bg-white/40 rounded-xl" />
      </div>
    </div>
  );
}
