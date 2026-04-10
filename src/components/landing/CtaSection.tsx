'use client';

import Link from 'next/link';
import Mascot from './Mascot';

export default function CtaSection() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="bg-primary/10 p-10 md:p-16 text-center border border-neutral-200 rounded-full relative">
          {/* Mascots */}
          <Mascot pose="jumping" size="md" className="absolute top-4 left-6 hidden sm:block" />
          <Mascot pose="fetching" size="md" className="absolute bottom-4 right-6 hidden sm:block" />

          <div className="relative z-10">
            <h2
              className="text-3xl md:text-4xl font-bold text-on-surface mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ready to Start Your Next Quilting Adventure?
            </h2>
            <p className="text-lg text-on-surface/70 mb-8 max-w-xl mx-auto">
              Explore QuiltCorgi today and experience the joy of effortless, digital quilt design.
              No credit card, no commitment — just you and your next great quilt.
            </p>

            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-primary text-white rounded-full font-bold text-lg hover:opacity-90 transition-all shadow-elevation-3"
            >
              Start Designing Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
