'use client';

import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

/* ── Inline mockup of the Picture My Blocks UI ──────────────────────── */
function BlocksMockup() {
  const BLOCK_IMAGES = [
    '/block1.png',
    '/block2.png',
    '/block3.png',
    '/block4.png',
    '/block5.png',
    '/block6.png',
  ];

  const FABRIC_SWATCHES = [
    '/fabrics/10227-B.jpg',
    '/fabrics/10227-C.jpg',
    '/fabrics/10227-E.jpg',
    '/fabrics/10227-G.jpg',
    '/fabrics/10227-K.jpg',
    '/fabrics/10227-L.jpg',
    '/fabrics/10227-O.jpg',
    '/fabrics/10227-P.jpg',
  ];

  const ACROSS = 3;
  const LONG = 3;
  const SASHING = 2;
  const BORDERS = 2;

  // Which cells have blocks placed (row-major order)
  const placedBlocks = new Set([0, 1, 4, 6, 7]);
  const blockMap: Record<number, number> = {
    0: 0, 1: 1, 4: 2, 6: 3, 7: 4,
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-elevated border border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Title bar */}
      <div className="border-b border-[var(--color-border)] px-4 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF5350] opacity-60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFE08A] opacity-60" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50] opacity-60" />
        </div>
        <span className="text-[10px] text-[var(--color-text-dim)] font-medium tracking-wide">QuiltCorgi — Picture My Blocks</span>
      </div>

      <div className="flex flex-col min-h-[380px] md:min-h-[420px]">
        {/* Top bar — layout controls */}
        <div className="h-10 flex items-center justify-between px-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
          <div className="w-12" />
          <div className="flex items-center gap-3">
            {/* Layout toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-medium text-[var(--color-text-dim)]">Layout</span>
              <span className="px-2 py-0.5 text-[9px] rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] font-medium">Grid</span>
              <span className="px-2 py-0.5 text-[9px] rounded-full text-[var(--color-text-dim)]/70">On Point</span>
            </div>
            <span className="h-3.5 w-px bg-[var(--color-border)]" />
            {/* Across */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--color-text-dim)]">{ACROSS}</span>
              <span className="text-[9px] text-[var(--color-text-dim)]">Across</span>
            </div>
            <span className="h-3.5 w-px bg-[var(--color-border)]" />
            {/* Long */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--color-text-dim)]">{LONG}</span>
              <span className="text-[9px] text-[var(--color-text-dim)]">Long</span>
            </div>
            <span className="h-3.5 w-px bg-[var(--color-border)]" />
            {/* Border */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--color-text-dim)]">{BORDERS}</span>
              <span className="text-[9px] text-[var(--color-text-dim)]">Border&quot;</span>
            </div>
            <span className="h-3.5 w-px bg-[var(--color-border)]" />
            {/* Sashing */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[var(--color-text-dim)]">{SASHING}</span>
              <span className="text-[9px] text-[var(--color-text-dim)]">Sash&quot;</span>
            </div>
          </div>
          <div className="w-12" />
        </div>

        {/* Main 3-column layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: My Blocks panel */}
          <div className="w-[140px] md:w-[160px] flex-shrink-0 flex flex-col bg-[var(--color-surface)] border-r border-[var(--color-border)]">
            <div className="px-2.5 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
              <span className="text-[10px] font-bold text-[var(--color-text)]">My Blocks</span>
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-[9px] font-bold">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                Upload
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-1.5">
                {BLOCK_IMAGES.map((src, i) => (
                  <div key={i} className="aspect-square rounded-sm overflow-hidden border border-[var(--color-border)] cursor-grab">
                    <Image
                      src={src}
                      alt={`Uploaded block ${i + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: canvas */}
          <div className="flex-1 flex items-center justify-center bg-[var(--color-bg)] p-4 overflow-auto">
            <div
              className="grid border shadow-elevated"
              style={{
                gridTemplateColumns: `repeat(${ACROSS}, 80px)`,
                gridTemplateRows: `repeat(${LONG}, 80px)`,
                gap: SASHING > 0 ? `${SASHING * 3}px` : '0',
                padding: BORDERS > 0 ? `${BORDERS * 3}px` : '0',
                backgroundColor: 'rgba(124, 185, 232, 0.08)',
              }}
            >
              {Array.from({ length: ACROSS * LONG }).map((_, i) => {
                const hasBlock = placedBlocks.has(i);
                return (
                  <div
                    key={i}
                    className={`w-20 h-20 border-2 flex items-center justify-center ${
                      hasBlock ? 'border-transparent' : 'border-dashed'
                    }`}
                    style={{
                      borderColor: hasBlock ? 'transparent' : 'rgba(124, 185, 232, 0.3)',
                      backgroundColor: hasBlock ? 'transparent' : 'rgba(124, 185, 232, 0.05)',
                    }}
                  >
                    {hasBlock ? (
                      <Image
                        src={BLOCK_IMAGES[blockMap[i]]}
                        alt="Placed block"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[8px] text-[var(--color-text-dim)]">Drop block here</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Fabric Library panel */}
          <div className="w-[140px] md:w-[160px] flex-shrink-0 flex flex-col bg-[var(--color-surface)] border-l border-[var(--color-border)]">
            <div className="px-2.5 py-2 border-b border-[var(--color-border)]">
              <span className="text-[10px] font-bold text-[var(--color-text)]">Fabric Library</span>
              <p className="text-[8px] text-[var(--color-text-dim)] mt-0.5">Drag fabrics to apply to borders and sashing</p>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <div className="grid grid-cols-2 gap-1.5">
                {FABRIC_SWATCHES.map((src, i) => (
                  <div key={i} className="aspect-square rounded-sm overflow-hidden border border-[var(--color-border)] cursor-grab">
                    <Image
                      src={src}
                      alt={`Fabric swatch ${i + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PictureMyBlocksMoment() {
  return (
    <section className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-14 lg:gap-20">
          {/* UI mockup */}
          <div className="lg:w-7/12">
            <ScrollReveal>
              <BlocksMockup />
            </ScrollReveal>
          </div>

          {/* Text */}
          <div className="lg:w-5/12">
            <ScrollReveal>
              <h2 className="font-heading text-4xl md:text-5xl font-extrabold leading-tight mb-6">
                You stitched it.{' '}
                <span className="text-[var(--color-text-dim)] font-light">We&apos;ll lay it out.</span>
              </h2>
              <p className="text-lg text-[var(--color-text-dim)] leading-relaxed mb-4">
                Snap photos of blocks you&apos;ve already sewn. Drag them
                into the digital grid, audition arrangements, and see the
                full quilt before you pick up a rotary cutter.
              </p>
              <ul className="space-y-3 mb-8">
                {['Upload photos of real blocks', 'Mix photos with digital patterns', 'Try layouts before you sew'].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-[var(--color-text)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0" />
                    <span className="text-base font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/picture-my-blocks" className="btn-secondary px-8 py-3">
                Picture My Blocks
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
