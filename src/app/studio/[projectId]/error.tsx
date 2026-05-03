'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function StudioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)] p-4">
      <div className="bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
          <AlertCircle size={32} strokeWidth={1.5} className="text-[var(--color-error)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">
          Something went wrong in the studio
        </h2>
        <p className="text-sm text-[var(--color-secondary)] mb-6">
          {error.message || 'An unexpected error occurred while loading your project.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-full bg-[var(--color-text)] text-[var(--color-bg)] text-sm font-semibold hover:opacity-90 transition-opacity"
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
