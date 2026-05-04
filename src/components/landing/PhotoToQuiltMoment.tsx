import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

export default function PhotoToQuiltMoment() {
  return (
    <section className="relative py-24 md:py-40 px-6 md:px-12 lg:px-20 overflow-hidden">
      {/* Background colour wash */}
      <div className="absolute inset-0 bg-[var(--color-secondary)]/10 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-28">
        {/* Imagery: overlapping before/after photos */}
        <div className="lg:w-1/2 relative h-[500px] md:h-[600px] w-full">
          <ScrollReveal>
            <div className="absolute w-[65%] aspect-[3/4] rounded-lg shadow-elevated overflow-hidden -rotate-6 left-[5%] top-[5%] z-20">
              <Image
                src="/images/shop/charm-packs.jpg" // TODO: Replace with a real photo (original image)
                alt="Original photo to convert"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 65vw, 350px"
                unoptimized
              />
              <div className="absolute bottom-3 left-3 bg-[var(--color-surface)]/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-elevated">
                Original
              </div>
            </div>
            <div className="absolute w-[60%] aspect-square rounded-lg shadow-elevated overflow-hidden rotate-3 right-[5%] bottom-[5%] z-30 border-4 border-[var(--color-primary)]">
              <Image
                src="/images/quilts/simple_quilt_three_1775442334013.png" // TODO: Replace with generated quilt pattern
                alt="Generated quilt design"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 60vw, 320px"
                unoptimized
              />
              <div className="absolute bottom-3 right-3 bg-[var(--color-primary)] text-[var(--color-text-on-primary)] px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-elevated">
                Quilt Pattern
              </div>
            </div>
            {/* Decorative needle and thread */}
            <svg className="absolute -top-6 -right-2 w-24 h-24 rotate-12 opacity-60 z-40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <path d="M24 4 L24 40 M24 28 L18 34 M24 32 L30 38" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="24" cy="40" r="2" fill="var(--color-primary)" />
            </svg>
          </ScrollReveal>
        </div>

        {/* Text */}
        <div className="lg:w-1/2">
          <ScrollReveal>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-[var(--color-primary)]" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-primary)]">Photo to Quilt</span>
            </div>
            <h2 className="font-heading text-5xl lg:text-7xl font-extrabold leading-[0.9] mb-8">
              Your memories,<br /><span className="text-[var(--color-accent)] font-light">redrawn in fabric.</span>
            </h2>
            <p className="text-lg text-[var(--color-text-dim)] leading-relaxed max-w-xl mb-10">
              Upload a photo and QuiltCorgi extracts the palette, matches it to your fabric library, and generates a quilt design you can edit, print, and sew. The hiking trail, the family cabin, the beloved corgi — preserved stitch by stitch.
            </p>
            <Link href="/photo-to-quilt" className="btn-primary px-8 py-3 text-base">
              Try Photo‑to‑Quilt
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
