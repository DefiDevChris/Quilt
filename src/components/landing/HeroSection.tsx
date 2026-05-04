import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';
import QuiltBlockSVG from './QuiltBlockSVG';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col justify-between px-6 pt-10 pb-20 md:px-12 lg:px-20 overflow-hidden">
      {/* Background decorative quilt blocks – subtle, rotated */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <QuiltBlockSVG className="absolute top-[-5%] right-[-3%] w-[50vw] h-[50vw] opacity-[0.04] rotate-12 text-[var(--color-primary)]" />
        <QuiltBlockSVG className="absolute bottom-[-10%] left-[-8%] w-[60vw] h-[60vw] opacity-[0.03] -rotate-6 text-[var(--color-secondary)]" />
        {/* Organic logo watermark – integrates brand without top‑left stamp */}
        <div className="absolute top-[15%] left-[50%] translate-x-[-50%] w-[70vw] md:w-[50vw] opacity-[0.04] mix-blend-multiply">
          <Image
            src="/logo.png" // TODO: Replace with final logo (transparent PNG, 512×512 recommended)
            alt=""
            width={512}
            height={512}
            className="w-full h-auto"
            unoptimized
          />
        </div>
      </div>

      {/* Minimal nav – not a rigid bar, just floating text links */}
      <header className="relative z-20 flex items-start justify-between">
        <Link href="/" className="inline-block" aria-label="QuiltCorgi home">
          {/* small logo lockup */}
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="QuiltCorgi Logo" width={36} height={36} className="w-9 h-9" unoptimized />
            <span className="font-heading font-extrabold text-2xl tracking-tight text-[var(--color-text)]">QuiltCorgi</span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/auth/signin" className="text-sm font-medium hover:text-[var(--color-primary-hover)] transition-colors duration-150">
            Sign in
          </Link>
          <Link href="/design-studio" className="btn-primary-sm">
            Open Studio
          </Link>
        </div>
      </header>

      {/* Main hero content – asymmetrical typography with floating image */}
      <div className="relative z-10 mt-24 md:mt-32 flex flex-col lg:flex-row items-start lg:items-end gap-12 lg:gap-0">
        <div className="lg:w-3/5">
          <ScrollReveal>
            <h1 className="font-heading text-[clamp(3.5rem,10vw,7rem)] font-extrabold leading-[0.9] tracking-tight text-[var(--color-text)] animate-fade-in">
              Design <span className="text-[var(--color-primary)]">quilts</span>
              <br />
              that hold <span className="text-[var(--color-text-dim)]">your stories.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal className="delay-300">
            <p className="mt-8 max-w-xl text-lg md:text-xl font-light text-[var(--color-text-dim)] leading-relaxed animate-fade-in">
              From the photograph to the finished block, QuiltCorgi keeps your hands busy with the creative part. No installations, no credit card — just your browser and your fabric stash.
            </p>
          </ScrollReveal>
          <ScrollReveal className="delay-500">
            <div className="mt-10 flex flex-wrap items-center gap-6 animate-fade-in">
              <Link href="/design-studio" className="btn-primary px-8 py-4 text-base">
                Start Designing
              </Link>
              <span className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-[var(--color-primary)]">
                <span className="w-8 h-px bg-[var(--color-primary)]" />
                Free to begin
              </span>
            </div>
          </ScrollReveal>
        </div>

        {/* Floating quilt image – offset and rotated for magazine feel */}
        <div className="lg:w-2/5 flex justify-center lg:justify-end relative -mt-8 md:mt-0">
          <div className="relative w-[85%] md:w-full max-w-[480px] aspect-[4/5] rounded-lg shadow-elevated -rotate-3 overflow-hidden border-4 border-[var(--color-bg)]">
            <Image
              src="/images/quilts/studio_quilt_ten_1775440971119.png" // TODO: Replace with a striking design‑studio quilt image
              alt="A colorful quilt design in the studio"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 85vw, 480px"
              priority
              unoptimized
            />
            {/* Decorative stitch line overlay */}
            <div className="absolute inset-0 border-[3px] border-dashed border-[var(--color-primary)] opacity-30 rounded-lg pointer-events-none" />
          </div>
          {/* Floating thread spool SVG */}
          <ThreadSpool className="absolute -bottom-6 -left-4 w-20 h-20 md:w-28 md:h-28 opacity-80 rotate-12 drop-shadow-lg" />
        </div>
      </div>
    </section>
  );
}

// Small inline SVG components used in HeroSection
function ThreadSpool({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke="var(--color-primary)" strokeWidth="2" />
      <circle cx="24" cy="24" r="10" stroke="var(--color-text-dim)" strokeWidth="1" strokeDasharray="3 3" />
      <path d="M12 24 L36 24" stroke="var(--color-secondary)" strokeWidth="1.5" />
      <path d="M24 12 L24 16 M24 32 L24 36" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
