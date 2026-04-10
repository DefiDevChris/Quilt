'use client';

import Link from 'next/link';

export default function PostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral p-4">
      <div className="bg-neutral border border-neutral-200 rounded-full p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">Couldn&apos;t load this post</h2>
        <p className="text-sm text-secondary mb-6">
          {error.message || 'Something went wrong while loading this thread.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <Link
            href="/socialthreads"
            className="px-5 py-2.5 rounded-full border border-neutral-200 text-neutral-800 text-sm font-semibold hover:bg-neutral-100 transition-colors"
          >
            Back to Community
          </Link>
        </div>
      </div>
    </div>
  );
}
