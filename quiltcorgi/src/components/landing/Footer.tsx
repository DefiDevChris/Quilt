import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="py-[3.5rem] bg-surface-container-low">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Corgi watermark */}
        <div className="flex justify-center mb-6" aria-hidden="true">
          <svg
            width="36"
            height="36"
            viewBox="0 0 28 28"
            fill="none"
            className="text-outline-variant"
          >
            <ellipse cx="14" cy="16" rx="10" ry="8" fill="currentColor" opacity="0.2" />
            <circle cx="10" cy="10" r="3.5" fill="currentColor" />
            <circle cx="18" cy="10" r="3.5" fill="currentColor" />
            <ellipse cx="14" cy="16" rx="7" ry="5.5" fill="currentColor" />
            <circle cx="11.5" cy="14.5" r="1.2" fill="var(--color-surface-container-low)" />
            <circle cx="16.5" cy="14.5" r="1.2" fill="var(--color-surface-container-low)" />
            <ellipse cx="14" cy="17" rx="1.8" ry="1" fill="currentColor" opacity="0.6" />
          </svg>
        </div>

        <div className="flex items-center justify-center gap-6 mb-6">
          <Link
            href="/about"
            className="text-[length:var(--font-size-body-sm)] text-secondary hover:text-on-surface transition-colors"
          >
            About
          </Link>
          <Link
            href="/privacy"
            className="text-[length:var(--font-size-body-sm)] text-secondary hover:text-on-surface transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-[length:var(--font-size-body-sm)] text-secondary hover:text-on-surface transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="text-[length:var(--font-size-body-sm)] text-secondary hover:text-on-surface transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/tutorials"
            className="text-[length:var(--font-size-body-sm)] text-secondary hover:text-on-surface transition-colors"
          >
            Tutorials
          </Link>
          <Link
            href="/blog"
            className="text-[length:var(--font-size-body-sm)] text-secondary hover:text-on-surface transition-colors"
          >
            Blog
          </Link>
        </div>

        <p className="text-[length:var(--font-size-body-sm)] text-outline-variant">
          &copy; 2026 QuiltCorgi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
