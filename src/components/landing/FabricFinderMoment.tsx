import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

export default function FabricFinderMoment() {
  return (
    <section className="relative py-24 md:py-40 px-6 md:px-12 lg:px-20 bg-[var(--color-text)] text-[var(--color-bg)] overflow-hidden">
      <div className="absolute inset-0 bg-[var(--color-primary-hover)] opacity-10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-28">
        {/* Imagery with price tag floating */}
        <div className="lg:w-1/2 relative h-[600px] w-full">
          <ScrollReveal>
            <div className="absolute w-[70%] aspect-[4/5] rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] -rotate-6 overflow-hidden left-[5%] top-[10%] z-20">
              <Image
                src="/images/shop/fabric-shop-shelves.jpg" // TODO: Replace with a fabric shop shelf photo
                alt="Fabric shop shelves"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 70vw, 400px"
                unoptimized
              />
            </div>
            <div className="absolute w-[55%] aspect-square rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-8 overflow-hidden right-[5%] bottom-[10%] z-30 border-4 border-[var(--color-text)]">
              <Image
                src="/images/shop/jelly-rolls.jpg" // TODO: Replace with jelly roll or fabric collection photo
                alt="Jelly rolls"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 55vw, 320px"
                unoptimized
              />
            </div>
            {/* Best price tag */}
            <div className="absolute top-[20%] right-[8%] z-40 bg-[var(--color-accent)] text-[var(--color-text)] p-4 rounded-lg shadow-elevated rotate-12 animate-float-3">
              <div className="text-xs uppercase font-bold tracking-widest opacity-80 mb-1">Best price</div>
              <div className="font-heading text-4xl font-extrabold">$9.48<span className="text-sm font-medium opacity-70">/yd</span></div>
            </div>
          </ScrollReveal>
        </div>

        <div className="lg:w-1/2">
          <ScrollReveal>
            <div className="inline-flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-[var(--color-accent)]" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--color-accent)]">Fabric Library</span>
            </div>
            <h2 className="font-heading text-5xl lg:text-7xl font-extrabold leading-[0.9] mb-8 text-[var(--color-surface)]">
              Real fabric.<br /><span className="text-[var(--color-primary)] font-light">Real prices.</span>
            </h2>
            <p className="text-lg text-[var(--color-border)] leading-relaxed max-w-xl mb-10">
              Browse quilting cottons pulled straight from real shops. Drop swatches into your design, filter by colour or brand, and we’ll find you the best price.
            </p>
            <ul className="space-y-4 mb-10 text-[var(--color-surface)]">
              {['Live catalogue from multiple retailers', 'Filter by colour · brand · price', 'Honest affiliate links'].map((item, i) => (
                <li key={i} className="flex items-center gap-4">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                  <span className="text-lg font-medium tracking-wide">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/fabrics" className="btn-primary px-8 py-3 !bg-[var(--color-accent)] !text-[var(--color-text)] hover:!bg-[var(--color-surface)] text-base shadow-elevated">
              Browse the library
            </Link>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
