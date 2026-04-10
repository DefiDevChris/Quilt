'use client';

import Link from 'next/link';

export function StudioGate() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 text-center md:hidden">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-outline-variant)"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-6"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
      <h1 className="text-xl font-bold text-neutral-800 mb-3">Your design is waiting</h1>
      <p className="text-sm text-neutral-500 leading-relaxed max-w-xs mb-8">
        Open Quilt Studio on a desktop to continue editing. The full design studio needs a larger
        screen.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white text-sm font-semibold transition-all shadow-elevation-1"
      >
        Back to Library
      </Link>
    </div>
  );
}
