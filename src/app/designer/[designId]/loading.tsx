export default function DesignerLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg)]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-lg bg-[var(--color-secondary)] animate-pulse" />
        <p className="text-[16px] leading-[24px] text-[var(--color-text-dim)]">
          Loading designer...
        </p>
      </div>
    </div>
  );
}
