export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-6 space-y-6">
      {/* Header */}
      <div className="h-8 w-48 bg-white/40 rounded-full" />
      {/* Bento grid skeleton */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 row-span-2 h-64 bg-white/40 rounded-[1.5rem]" />
        <div className="col-span-5 h-28 bg-white/40 rounded-[1.5rem]" />
        <div className="col-span-5 h-28 bg-white/40 rounded-[1.5rem]" />
        <div className="col-span-4 h-28 bg-white/40 rounded-[1.5rem]" />
        <div className="col-span-4 h-28 bg-white/40 rounded-[1.5rem]" />
        <div className="col-span-4 h-28 bg-white/40 rounded-[1.5rem]" />
      </div>
    </div>
  );
}
