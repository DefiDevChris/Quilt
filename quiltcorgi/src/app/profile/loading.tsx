export default function ProfileLoading() {
  return (
    <div className="animate-pulse max-w-2xl mx-auto p-6 space-y-6">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full bg-white/50" />
        <div className="space-y-2">
          <div className="h-6 w-40 bg-white/50 rounded-full" />
          <div className="h-4 w-24 bg-white/40 rounded-full" />
        </div>
      </div>
      {/* Stats */}
      <div className="flex gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1 text-center">
            <div className="h-5 w-8 mx-auto bg-white/50 rounded-full" />
            <div className="h-3 w-16 bg-white/40 rounded-full" />
          </div>
        ))}
      </div>
      {/* Bio */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-white/40 rounded-full" />
        <div className="h-4 w-2/3 bg-white/40 rounded-full" />
      </div>
    </div>
  );
}
