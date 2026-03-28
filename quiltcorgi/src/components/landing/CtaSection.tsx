'use client';

import Link from 'next/link';
import Mascot from './Mascot';

export default function CtaSection() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24 bg-warm-bg">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-br from-warm-peach/10 to-warm-golden/10 rounded-3xl p-10 md:p-16 text-center border border-warm-border relative overflow-hidden">
          {/* Mascots */}
          <div className="absolute -top-4 left-8 hidden sm:block">
            <Mascot pose="jumping" size="md" />
          </div>
          <div className="absolute -bottom-4 right-8 hidden sm:block">
            <Mascot pose="fetching" size="md" />
          </div>

          <div className="relative z-10">
            <h2
              className="text-3xl md:text-4xl font-bold text-warm-text mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ready to Start Designing?
            </h2>
            <p className="text-lg text-warm-text-secondary mb-8 max-w-xl mx-auto">
              Join quilters using QuiltCorgi to bring their designs to life. No credit card required.
            </p>

            <Link
              href="/auth/signup"
              className="inline-flex px-8 py-4 bg-warm-peach text-warm-text rounded-full font-bold text-lg hover:bg-warm-peach-dark transition-all shadow-lg"
            >
              Start Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
