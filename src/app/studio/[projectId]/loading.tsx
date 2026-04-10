export default function StudioLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#fdfaf7]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-lg bg-[#ffc8a6] animate-pulse" />
        <p className="text-[16px] leading-[24px] text-[#6b655e]">Loading studio...</p>
      </div>
    </div>
  );
}
