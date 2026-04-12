import Link from 'next/link';
import Mascot from './Mascot';
import { QuiltPieceRow } from '@/components/decorative/QuiltPiece';

export default function CtaSection() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24 bg-default relative overflow-hidden">

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="bg-primary/10 p-10 md:p-16 text-center border border-default rounded-lg relative overflow-hidden">
          {/* Decorative stitch outline via SVG overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            <rect
              x="8"
              y="8"
              width="calc(100% - 16px)"
              height="calc(100% - 16px)"
              fill="none"
              stroke="#ff8d49"
              strokeWidth="2"
              strokeDasharray="8 6"
              strokeLinecap="round"
              rx="8"
              opacity="0.15"
            />
          </svg>

          {/* Mascots */}
          <Mascot pose="jumping" size="md" className="absolute top-4 left-6 z-10 hidden sm:block" />
          <Mascot pose="fetching" size="md" className="absolute bottom-4 right-6 z-10 hidden sm:block" />

          <div className="relative z-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QuiltPieceRow count={3} size={8} gap={4} />
            </div>
            <h2
              className="text-[32px] leading-[40px] md:text-[36px] md:leading-[44px] font-bold text-default mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Ready to Start Your Next Quilting Adventure?
            </h2>
            <p className="text-[18px] leading-[28px] text-dim mb-8 max-w-xl mx-auto">
              Explore QuiltCorgi today and experience the joy of effortless, digital quilt design.
              No credit card, no commitment &mdash; just you and your next great quilt.
            </p>

            <Link
              href="/auth/signup"
              className="px-8 py-4 bg-primary text-default rounded-full font-bold text-lg hover:bg-primary-dark transition-colors duration-150 shadow-[0_1px_2px_rgba(26,26,26,0.08)] inline-block"
            >
              Start Designing Free
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
