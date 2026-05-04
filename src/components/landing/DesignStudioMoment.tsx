import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

export default function DesignStudioMoment() {
  return (
    <section className="relative py-24 md:py-40 px-6 md:px-12 lg:px-20 overflow-visible">
      {/* Desktop version: full screenshot with overlapping UI hints */}
      <div className="hidden md:block relative">
        <ScrollReveal>
          <div className="relative mx-auto max-w-6xl">
            {/* Staggered layout: main screenshot tilted, smaller snippets offset */}
            <div className="relative w-full aspect-video rounded-lg shadow-elevated overflow-hidden -rotate-1">
              <Image
                src="/screenshots/studio-1.png" // TODO: Replace with actual Design Studio screenshot (16:10, e.g. 2880×1800)
                alt="Design Studio worktable interface"
                fill
                className="object-cover"
                sizes="(max-width: 1280px) 100vw, 1200px"
                unoptimized
              />
              {/* Overlay with a “desktop only” badge */}
              <div className="absolute top-6 right-6 bg-[var(--color-surface)]/90 backdrop-blur px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest shadow-elevated">
                Desktop Studio
              </div>
            </div>

            {/* Floating block‑builder thumbnail – overlapped */}
            <div className="absolute -bottom-8 -left-4 w-48 rotate-6 rounded-lg shadow-elevated overflow-hidden border-4 border-[var(--color-bg)]">
              <Image
                src="/images/quilts/studio_quilt_two_1775440552376.png" // TODO: Replace with Block Builder screenshot
                alt="Block Builder view"
                width={300}
                height={200}
                className="object-cover w-full h-full"
                unoptimized
              />
            </div>

            {/* Text panel tucked into the composition */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72 bg-[var(--color-bg)]/95 p-6 rounded-lg shadow-elevated -rotate-2">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-px bg-[var(--color-primary)]" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-primary)]">The Studio</span>
              </div>
              <h2 className="font-heading text-2xl font-extrabold leading-tight mb-2">Two worktables. One canvas.</h2>
              <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
                The Worktable assembles full quilts. The Block Builder is your dedicated drafting space. Switch seamlessly.
              </p>
              <Link href="/design-studio" className="btn-secondary-sm mt-4 inline-block">
                Explore the tools
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Mobile message – crafty typography with quilt motif */}
      <div className="md:hidden relative mt-12">
        <ScrollReveal>
          <div className="text-center px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-secondary)]/30 mb-8">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h2 className="font-heading text-4xl font-extrabold leading-none mb-4">
              Plan on <span className="text-[var(--color-primary)]">desktop</span>,<br />quilt anywhere.
            </h2>
            <p className="text-[var(--color-text-dim)] max-w-xs mx-auto">
              The Design Studio loves a big screen. Open it on your computer for the full workspace, but your patterns travel with you.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
