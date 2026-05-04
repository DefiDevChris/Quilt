import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

export default function PictureMyBlocksMoment() {
  return (
    <section className="relative py-24 md:py-40 px-6 md:px-12 lg:px-20 overflow-hidden">
      {/* Giant background word – editorial touch */}
      <div className="absolute top-0 right-0 text-[20vw] font-heading font-extrabold text-[var(--color-secondary)] opacity-10 pointer-events-none select-none whitespace-nowrap leading-none">
        BLOCKS
      </div>

      <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-28">
        {/* Scattered block images */}
        <div className="lg:w-7/12 relative h-[500px] w-full">
          <ScrollReveal>
            <div className="absolute top-[5%] left-[15%] w-[35%] aspect-square rounded-lg shadow-elevated -rotate-12 overflow-hidden border-[8px] border-[var(--color-bg)] z-20">
              <Image src="/images/quilts/simple_quilt_four_1775442346667.png" alt="Quilt block example" fill className="object-cover" unoptimized />
            </div>
            <div className="absolute bottom-[10%] left-[30%] w-[30%] aspect-square rounded-lg shadow-elevated rotate-8 overflow-hidden border-[6px] border-[var(--color-bg)] z-30">
              <Image src="/images/quilts/simple_quilt_one_1775442292809.png" alt="Quilt block example" fill className="object-cover" unoptimized />
            </div>
            <div className="absolute top-[20%] right-[10%] w-[45%] aspect-square rounded-lg shadow-elevated -rotate-3 overflow-hidden border-[10px] border-[var(--color-bg)] z-10">
              <Image src="/images/quilts/gallery_quilt_three_1775440641353.png" alt="Quilt block example" fill className="object-cover" unoptimized />
            </div>
            {/* Corgi paw motif overlapping */}
            <CorgiMotif className="absolute bottom-[5%] right-[5%] w-16 h-16 rotate-12 opacity-40 z-40" />
          </ScrollReveal>
        </div>

        <div className="lg:w-5/12">
          <ScrollReveal>
            <h2 className="font-heading text-5xl lg:text-6xl font-extrabold leading-[0.9] mb-8">
              You stitched it.<br /><span className="text-[var(--color-primary-hover)] font-light">We’ll lay it out.</span>
            </h2>
            <p className="text-lg text-[var(--color-text-dim)] leading-relaxed mb-10 max-w-md">
              Snap a photo of the blocks you’ve already sewn. Drag them into the digital grid alongside drawn blocks, audition arrangements, and see the full quilt — before you pick up a rotary cutter again.
            </p>
            <Link href="/picture-my-blocks" className="btn-secondary px-8 py-3">
              Picture My Blocks
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function CorgiMotif({ className }: { className?: string }) {
  // Simple corgi silhouette as inline SVG
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <path d="M12 36 C12 36 14 20 24 20 C34 20 36 36 36 36" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="18" cy="24" r="2" fill="var(--color-text-dim)" />
      <circle cx="30" cy="24" r="2" fill="var(--color-text-dim)" />
      <path d="M24 28 L24 30 M22 30 L26 30" stroke="var(--color-text-dim)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 36 C8 44 12 48 24 48 C36 48 40 44 36 36" stroke="var(--color-primary)" strokeWidth="2" fill="none" />
    </svg>
  );
}
