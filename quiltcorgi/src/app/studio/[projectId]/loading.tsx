export default function StudioLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-surface">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        <p className="text-sm text-secondary font-medium">Loading studio...</p>
      </div>
    </div>
  );
}
