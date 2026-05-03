'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="p-8 font-sans max-w-xl mx-auto">
          <h1 className="text-2xl mb-4">Something went wrong</h1>
          <p className="mb-6 text-[var(--color-secondary)]">
            We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-[var(--color-text)] text-[var(--color-bg)] rounded-full cursor-pointer"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
