export default function PostDetailLoading() {
  return (
    <div className="animate-pulse max-w-3xl mx-auto p-6 space-y-4">
      <div className="bg-[#ffffff] border border-[#e8e1da] rounded-lg overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-[#e8e1da]">
          <div className="w-10 h-10 rounded-full bg-[#fdfaf7]" />
          <div className="space-y-2">
            <div className="h-4 w-32 bg-[#e8e1da] rounded-lg" />
            <div className="h-3 w-20 bg-[#e8e1da] rounded-lg" />
          </div>
        </div>
        <div className="p-5 space-y-3">
          <div className="h-6 w-3/4 bg-[#e8e1da] rounded-lg" />
          <div className="h-4 w-full bg-[#e8e1da] rounded-lg" />
          <div className="h-4 w-2/3 bg-[#e8e1da] rounded-lg" />
        </div>
        <div className="aspect-video bg-[#fdfaf7]" />
      </div>
    </div>
  );
}
