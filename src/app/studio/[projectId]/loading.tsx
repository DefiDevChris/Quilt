export default function StudioLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-lg bg-secondary animate-pulse" />
        <p className="text-[16px] leading-[24px] text-text-dim">Loading studio...</p>
      </div>
    </div>
  );
}
