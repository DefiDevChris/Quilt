import Link from 'next/link';

export default function HeroSection() {
  return (
    <section className="relative py-[7rem] bg-surface px-4 overflow-hidden">
      {/* Faint quilted texture background */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23383831' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
        {/* Left column (55%) */}
        <div className="w-full lg:w-[55%] text-center lg:text-left">
          <h1 className="font-sans font-bold text-[2.5rem] sm:text-[3rem] lg:text-[3.5rem] tracking-[-0.02em] leading-[1.1] text-on-surface">
            Design quilts in your browser.
          </h1>
          <p className="mt-6 text-[length:var(--font-size-body-lg)] text-secondary max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Professional block drafting, fabric visualization, and 1:1 pattern
            printing — free to start, no download required.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
            <Link
              href="/auth/signup"
              className="inline-flex items-center bg-primary text-primary-on font-medium px-6 py-3 rounded-[var(--radius-md)] hover:opacity-90 transition-opacity"
            >
              Start Designing Free
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-primary font-medium hover:opacity-80 transition-opacity"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.5 4.5v11l9-5.5z" />
              </svg>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Right column (45%) — screenshot placeholder */}
        <div className="w-full lg:w-[45%] flex justify-center">
          <div
            className="w-full max-w-md aspect-[4/3] bg-surface-container rounded-[var(--radius-lg)] shadow-[var(--shadow-elevation-3)] flex items-center justify-center"
            style={{ transform: 'rotate(3deg)' }}
            aria-hidden="true"
          >
            <div className="text-center text-secondary p-8">
              <svg
                width="48"
                height="48"
                viewBox="0 0 48 48"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="mx-auto mb-3"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <rect x="28" y="4" width="16" height="16" rx="2" />
                <rect x="4" y="28" width="16" height="16" rx="2" />
                <rect x="28" y="28" width="16" height="16" rx="2" />
              </svg>
              <p className="text-[length:var(--font-size-body-sm)]">
                Quilt design screenshot
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
