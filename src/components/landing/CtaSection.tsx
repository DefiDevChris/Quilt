'use client';

import Link from 'next/link';
import Mascot from './Mascot';

export default function CtaSection() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24 bg-background">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl p-10 md:p-16 text-center border border-outline-variant relative">
          {/* Mascots */}
          <div className="absolute top-4 left-6 hidden sm:block">
            <Mascot pose="jumping" size="md" />
          </div>
          <div className="absolute bottom-4 right-6 hidden sm:block">
            <Mascot pose="fetching" size="md" />
          </div>

          <div className="relative z-10">
            <h2
              className="text-3xl md:text-4xl font-bold text-on-surface mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ready to Start Your Next Quilting Adventure?
            </h2>
            <p className="text-lg text-secondary mb-8 max-w-xl mx-auto">
              Explore QuiltCorgi today and experience the joy of effortless, digital quilt design.
              No credit card, no commitment — just you and your next great quilt.
            </p>

            <Link href="/auth/signup" className="btn-primary">
              Start Designing Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
