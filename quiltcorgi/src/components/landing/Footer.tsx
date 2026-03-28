import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="py-[3.5rem] bg-surface-container-low">
      <div className="max-w-4xl mx-auto px-4 text-center">
        {/* Corgi watermark */}
        <div className="flex justify-center mb-6" aria-hidden="true">
          <Image src="/corgi3.png" alt="Corgi Watermark" width={48} height={48} className="opacity-30 grayscale" />
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
