'use client';

import { RADIUS } from '@/lib/design-system';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{ padding: '2rem', fontFamily: 'var(--font-sans)', maxWidth: '600px', margin: '0 auto' }}
        >
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ marginBottom: '1.5rem', color: 'var(--color-secondary)' }}>
            We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--color-text)',
              color: 'var(--color-surface)',
              border: 'none',
              borderRadius: RADIUS.full,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
