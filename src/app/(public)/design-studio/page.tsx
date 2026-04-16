import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'QuiltCorgi';

export const metadata: Metadata = {
  title: `${APP_NAME} Design Studio — Design Your Next Quilt in the Browser`,
  description:
    'Design quilts in your browser with a growing block library, drag-and-drop fabrics, and 1:1 PDF export. Free to start, low-cost Pro subscription.',
  openGraph: {
    title: `${APP_NAME} Design Studio`,
    description:
      'A modern, browser-based quilt design studio. Free to start, low-cost Pro subscription.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: `${APP_NAME} Design Studio` }],
  },
};

export default function DesignStudioLandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <main className="flex-1 flex items-center justify-center px-6 py-16 lg:py-24">
        <div className="max-w-lg text-center">
          <div className="flex justify-center mb-8">
            <Image
              src="/logo.png"
              alt="QuiltCorgi Logo"
              width={64}
              height={64}
              unoptimized
              className="object-contain"
            />
          </div>

          <h1
            className="text-4xl lg:text-5xl font-bold text-[var(--color-text)] mb-4"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Design Studio
          </h1>

          <p className="text-lg text-[var(--color-text-dim)] mb-4 leading-relaxed">
            A modern, browser-based quilt design studio. Pick a layout, drag in blocks and fabrics,
            and export print-ready PDF patterns — all from your browser.
          </p>

          <ul className="text-left text-[var(--color-text-dim)] text-sm mb-10 space-y-2 max-w-sm mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)] mt-0.5 shrink-0">&#10003;</span>
              Growing block library with custom block builder
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)] mt-0.5 shrink-0">&#10003;</span>
              Drag-and-drop fabric assignment from curated collections
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)] mt-0.5 shrink-0">&#10003;</span>
              True-scale PDF export with seam allowances and yardage
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--color-primary)] mt-0.5 shrink-0">&#10003;</span>
              Free to start — Pro subscription unlocks everything
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-[var(--color-primary)] text-[var(--color-text)] rounded-full text-lg font-semibold hover:bg-[#d97054] transition-colors duration-150 shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
            >
              Start Designing
            </Link>
            <Link
              href="/auth/signin"
              className="px-8 py-3 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-full text-lg font-semibold hover:bg-[var(--color-primary)]/10 transition-colors duration-150"
            >
              Sign In
            </Link>
          </div>

          <p className="mt-8 text-xs text-[var(--color-text-dim)]">
            Free accounts get access to the full studio. Pro unlocks PDF export, custom fabric
            uploads, and more.
          </p>
        </div>
      </main>
    </div>
  );
}
