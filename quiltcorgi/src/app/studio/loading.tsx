export default function StudioIndexLoading() {
  return (
    <div className="animate-pulse p-6 max-w-5xl mx-auto space-y-6">
      <div className="h-8 w-36 bg-white/40 rounded-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card rounded-[1.5rem] overflow-hidden">
            <div className="aspect-square bg-white/30" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-white/50 rounded-full" />
              <div className="h-3 w-1/2 bg-white/40 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
