'use client';

import Link from 'next/link';

export default function DesignerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-8 max-w-md w-full text-center shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[var(--color-error)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
          Something went wrong in the designer
        </h2>
        <p className="text-sm text-[var(--color-secondary)] mb-6">
          {error.message || 'An unexpected error occurred while loading your design.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-full bg-[var(--color-primary)] text-[var(--color-text)] text-sm font-semibold hover:bg-[var(--color-primary)]/90 transition-colors duration-150"
          >
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="px-5 py-2.5 rounded-full border border-[var(--color-border)] text-[var(--color-text)] text-sm font-semibold hover:bg-[var(--color-border)]/30 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
