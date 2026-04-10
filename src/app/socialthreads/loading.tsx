export default function SocialThreadsLoading() {
  return (
    <div className="animate-pulse max-w-2xl mx-auto p-6 space-y-4">
      {/* Feed header */}
      <div className="h-8 w-32 bg-neutral-100 rounded-full" />
      {/* Post cards */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-neutral border border-neutral-200 rounded-full p-5 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/50" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 bg-neutral-100 rounded-full" />
              <div className="h-3 w-16 bg-neutral-100 rounded-full" />
            </div>
          </div>
          <div className="h-5 w-3/4 bg-neutral-100 rounded-full" />
          <div className="h-4 w-full bg-neutral-100 rounded-full" />
          <div className="aspect-video bg-neutral-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}
