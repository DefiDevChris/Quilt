'use client';

import Link from 'next/link';
import { COLORS, SHADOW, COLORS_HOVER } from '@/lib/design-system';

export function DesignerGate() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-8 text-center md:hidden">
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
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
      <h1 className="text-xl font-bold text-[var(--color-text)] mb-3">Your design is waiting</h1>
      <p className="text-sm text-[var(--color-text-dim)] leading-relaxed max-w-xs mb-8">
        Open Quilt Designer on a desktop to continue arranging your blocks. The full designer needs
        a larger screen.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[var(--color-text)] text-sm font-semibold transition-colors"
        style={{
          backgroundColor: COLORS.primary,
          boxShadow: SHADOW.brand,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS_HOVER.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.primary;
        }}
      >
        Back to Library
      </Link>
    </div>
  );
}
