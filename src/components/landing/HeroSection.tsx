import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

export default function HeroSection() {
  return (
    <section className="relative flex flex-col px-6 pt-12 pb-20 md:px-12 lg:px-20">
      {/* Hero content */}
      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-20 mt-8 md:mt-12">
        {/* Text */}
        <div className="lg:w-1/2 max-w-2xl">
          <ScrollReveal>
            <h1 className="font-heading text-[clamp(2.8rem,7vw,5.5rem)] font-extrabold leading-[1.05] tracking-tight text-[var(--color-text)]">
              Design <span className="text-[var(--color-primary)]">quilts</span> that hold{' '}
              <span className="text-[var(--color-text-dim)]">your stories.</span>
            </h1>
          </ScrollReveal>
          <ScrollReveal className="delay-300">
            <p className="mt-6 max-w-lg text-lg text-[var(--color-text-dim)] leading-relaxed">
              A browser-based studio for quilters. Turn photos into patterns,
              audition block layouts, find real fabric prices — and never
              wonder how it&apos;ll look before you sew.
            </p>
          </ScrollReveal>
          <ScrollReveal className="delay-500">
            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link href="/design-studio" className="btn-primary px-8 py-3 text-base">
                Start Designing — Free
              </Link>
            </div>
          </ScrollReveal>
        </div>

        {/* Hero image — clean, straight, framed */}
        <div className="lg:w-1/2 flex justify-center">
          <ScrollReveal className="delay-300">
            <div className="relative max-w-[520px] w-full">
              <div className="rounded-lg overflow-hidden shadow-elevated border border-[var(--color-border)]">
                <Image
                  src="/p2q.png"
                  alt="Photo-to-Quilt transformation preview"
                  width={1024}
                  height={1024}
                  className="w-full h-auto object-cover"
                  sizes="(max-width: 768px) 90vw, 520px"
                  priority
                  unoptimized
                />
              </div>
              {/* Small accent quilt thumbnail */}
              <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-lg overflow-hidden shadow-elevated border-4 border-[var(--color-bg)] hidden md:block">
                <Image
                  src="/p2q-quilt.png"
                  alt="Quilt pattern detail"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
