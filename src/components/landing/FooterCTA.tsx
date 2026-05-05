import Image from 'next/image';
import Link from 'next/link';
import ScrollReveal from './ScrollReveal';

export default function FooterCTA() {
  return (
    <section className="relative py-28 md:py-40 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          {/* Small mascot above the CTA */}
          <div className="flex justify-center mb-10">
            <Image
              src="/mascots&avatars/corgi29.png"
              alt="QuiltCorgi mascot"
              width={80}
              height={80}
              className="w-20 h-20 object-contain"
              unoptimized
            />
          </div>

          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-light text-[var(--color-text)] leading-[1.2] mb-10 max-w-2xl mx-auto">
            From the first cut to the binding stitch, you&apos;ll know{' '}
            <span className="font-extrabold">exactly</span> how it will look.
          </h2>

          <div className="flex flex-col items-center gap-6">
            <Link href="/auth/signup" className="btn-primary px-10 py-4 text-lg shadow-elevated">
              Create your free account
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
