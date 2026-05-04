import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

export default function FooterCTA() {
  return (
    <section className="relative py-32 md:py-48 px-6 flex flex-col items-center justify-center text-center overflow-hidden">
      {/* Decorative stitching lines */}
      <div className="absolute top-10 left-10 w-24 h-24 opacity-20 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" stroke="var(--color-primary)" strokeWidth="1" strokeDasharray="4 4">
          <path d="M4 4 L44 44 M44 4 L4 44" />
        </svg>
      </div>
      <div className="absolute bottom-10 right-10 w-32 h-32 opacity-20 pointer-events-none" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" stroke="var(--color-secondary)" strokeWidth="1" strokeDasharray="4 4">
          <circle cx="24" cy="24" r="20" />
          <circle cx="24" cy="24" r="12" />
        </svg>
      </div>

      <ScrollReveal>
        <div className="max-w-3xl">
          <p className="font-heading text-4xl sm:text-5xl lg:text-7xl font-light text-[var(--color-text)] leading-[1.1] mb-12">
            <span className="text-[var(--color-primary)]">“</span>
            From the first cut to the binding stitch, you’ll know <span className="font-extrabold italic">exactly</span> how it will look.
            <span className="text-[var(--color-primary)]">”</span>
          </p>
          <div className="flex flex-col items-center gap-8">
            <Link href="/auth/signup" className="btn-primary px-12 py-5 text-lg shadow-elevated">
              Create your free account
            </Link>
            <p className="text-[var(--color-text-dim)] font-medium text-sm max-w-xs">
              No credit card. No installation. Just a browser and an idea.
            </p>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
