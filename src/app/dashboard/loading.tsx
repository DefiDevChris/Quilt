export default function DashboardLoading() {
  return (
    <div className="animate-pulse p-6 space-y-8">
      {/* Header skeleton */}
      <div className="h-4 w-48 bg-[#e8e1da] rounded-lg" />
      <div className="h-20 w-80 bg-[#e8e1da] rounded-lg" />
      <div className="h-4 w-64 bg-[#e8e1da] rounded-lg" />
      {/* Bento grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-40 bg-[#e8e1da] rounded-lg border-2 border-[#2d2a26]" />
        <div className="h-40 bg-[#e8e1da] rounded-lg border-2 border-[#2d2a26]" />
      </div>
    </div>
  );
}
