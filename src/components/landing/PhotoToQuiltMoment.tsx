'use client';

import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

/* ── Inline mockup of the Photo-to-Quilt conversion UI ──────────────── */
function PhotoToQuiltMockup() {
  const PALETTE = ['#5B8C6E', '#8FB4A0', '#D4C4A0', '#E8D9B0', '#6B9EBF', '#3A6B8C'];

  return (
    <div className="rounded-lg overflow-hidden shadow-elevated border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Title bar */}
      <div className="border-b border-[var(--color-border)] px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF5350] opacity-60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFE08A] opacity-60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50] opacity-60" />
        </div>
        <span className="text-[10px] text-[var(--color-text-dim)] font-medium tracking-wide">QuiltCorgi — Photo to Quilt</span>
      </div>

      <div className="p-4 md:p-6">
        {/* Two-panel layout: photo → quilt */}
        <div className="grid grid-cols-2 gap-4 md:gap-6">
          {/* Left: source photo */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-dim)] mb-2">Source Photo</div>
            <div className="rounded-lg overflow-hidden border border-[var(--color-border)] aspect-square">
              <Image
                src="/images/quilts/gallery_quilt_one_1775440540412.png"
                alt="Source photograph for quilt conversion"
                width={400}
                height={400}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Right: generated quilt grid */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)] mb-2">Generated Pattern</div>
            <div className="rounded-lg border-2 border-[var(--color-primary)] overflow-hidden aspect-square">
              <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
                {Array.from({ length: 64 }).map((_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const ci = (row + col * 3 + Math.floor(row / 2)) % PALETTE.length;
                  return (
                    <div key={i} style={{ backgroundColor: PALETTE[ci] }} />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Extracted palette */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-dim)] mb-2">Extracted Palette</div>
          <div className="flex gap-2">
            {PALETTE.map((c) => (
              <div key={c} className="flex flex-col items-center gap-1">
                <span className="w-8 h-8 md:w-10 md:h-10 rounded-lg border border-[var(--color-border)]" style={{ backgroundColor: c }} />
                <span className="text-[8px] md:text-[9px] text-[var(--color-text-dim)] font-mono">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PhotoToQuiltMoment() {
  return (
    <section className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20 bg-[var(--color-secondary)]/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
          {/* Text */}
          <div className="lg:w-5/12 order-2 lg:order-1">
            <ScrollReveal>
              <h2 className="font-heading text-4xl md:text-5xl font-extrabold leading-tight mb-6">
                Your memories, <span className="text-[var(--color-text-dim)] font-light">redrawn in fabric.</span>
              </h2>
              <p className="text-lg text-[var(--color-text-dim)] leading-relaxed mb-4">
                Upload any photo and QuiltCorgi extracts the palette, matches
                it to your fabric library, and generates a quilt design you
                can edit, print, and sew.
              </p>
              <p className="text-base text-[var(--color-text-dim)] leading-relaxed mb-8">
                The hiking trail, the family cabin, the beloved corgi —
                preserved stitch by stitch.
              </p>
              <Link href="/photo-to-quilt" className="btn-primary px-8 py-3 text-base">
                Try Photo‑to‑Quilt
              </Link>
            </ScrollReveal>
          </div>

          {/* UI mockup */}
          <div className="lg:w-7/12 order-1 lg:order-2">
            <ScrollReveal>
              <PhotoToQuiltMockup />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
