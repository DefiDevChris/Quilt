'use client';

export function MobileGate() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-8 text-center">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-6"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      <h1 className="text-xl font-bold text-[var(--color-text)] mb-3">
        Designed for use on computer
      </h1>
      <p className="text-sm text-[var(--color-text-dim)] leading-relaxed max-w-xs">
        Open Quilt Studio on a desktop or laptop for the full design experience.
      </p>
    </div>
  );
}
