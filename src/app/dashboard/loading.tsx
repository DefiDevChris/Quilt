export default function DashboardLoading() {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-[1fr_1fr_0.75fr] gap-8">
      <div className="h-[280px] bg-[var(--color-border)] rounded-lg border border-[var(--color-text)]/[0.03]" />
      <div className="h-[280px] bg-[var(--color-border)] rounded-lg border border-[var(--color-text)]/[0.03]" />
      <div className="h-full bg-[var(--color-border)] rounded-lg border border-[var(--color-primary)]/20 lg:row-span-2" />
      <div className="h-[280px] bg-[var(--color-border)] rounded-lg border border-[var(--color-text)]/[0.03]" />
      <div className="h-[280px] bg-[var(--color-border)] rounded-lg border border-[var(--color-text)]/[0.03]" />
      <div className="h-[280px] bg-[var(--color-border)] rounded-lg border border-black/[0.03]" />
    </div>
  );
}
