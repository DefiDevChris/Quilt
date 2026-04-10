export default function PostDetailLoading() {
  return (
    <div className="animate-pulse max-w-3xl mx-auto p-6 space-y-4">
      <div className="bg-neutral border border-neutral-200 rounded-full overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-neutral-200">
          <div className="w-10 h-10 rounded-full bg-white/50" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-neutral-100 rounded-full" />
            <div className="h-3 w-20 bg-neutral-100 rounded-full" />
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="h-6 w-3/4 bg-neutral-100 rounded-full" />
          <div className="h-4 w-full bg-neutral-100 rounded-full" />
          <div className="h-4 w-2/3 bg-neutral-100 rounded-full" />
        </div>
        <div className="aspect-video bg-white/30" />
      </div>
    </div>
  );
}
