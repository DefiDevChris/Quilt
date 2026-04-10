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
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf7] p-4">
      <div className="bg-[#ffffff] border border-[#e8e1da] rounded-lg p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-[#2d2a26] mb-2">Couldn&apos;t load this post</h2>
        <p className="text-sm text-[#6b655e] mb-6">
          {error.message || 'Something went wrong while loading this thread.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-lg bg-[#ff8d49] text-[#2d2a26] text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150"
          >
            Try Again
          </button>
          <Link
            href="/socialthreads"
            className="px-6 py-2.5 rounded-lg border-2 border-[#ff8d49] text-[#ff8d49] text-sm font-semibold hover:bg-[#ff8d49]/10 transition-colors duration-150"
          >
            Back to Community
          </Link>
        </div>
      </div>
    </div>
  );
}
