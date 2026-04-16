'use client';

import Link from 'next/link';
import { COLORS } from '@/lib/design-system';

export default function DesignStudioFeature() {
  return (
    <section className="py-24" style={{ backgroundColor: COLORS.bg }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-lg overflow-hidden flex flex-col md:flex-row items-stretch border"
          style={{
            backgroundColor: `${COLORS.primary}10`,
            borderColor: `${COLORS.primary}33`,
          }}
        >
          {/* Text column */}
          <div className="w-full md:w-1/2 p-12 lg:p-16 flex flex-col justify-center">
            <p
              className="text-base italic mb-3"
              style={{
                color: COLORS.primary,
                fontFamily: 'var(--font-display)',
              }}
            >
              The Design Studio
            </p>
            <h2
              className="text-4xl md:text-5xl mb-6 leading-tight"
              style={{
                fontFamily: 'var(--font-display)',
                color: COLORS.text,
              }}
            >
              Sketch your next quilt.
            </h2>
            <p className="text-lg mb-8 leading-relaxed" style={{ color: COLORS.textDim }}>
              Every quilt starts with an idea. Piece yours together here — block by block, fabric by
              fabric — until it feels like yours.
            </p>

            {/* Feature bullets */}
            <ul className="space-y-3 mb-10">
              {[
                'A library of classic blocks, ready when you are',
                'Swap fabrics, rearrange, and see it come together',
                'Take home a print-ready pattern when you&rsquo;re happy',
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-base leading-snug"
                  style={{ color: COLORS.text }}
                >
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: COLORS.primary }}
                  >
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke={COLORS.surface}
                      viewBox="0 0 24 24"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/design-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-8 py-3.5 rounded-full font-semibold transition-colors shadow-sm text-base"
                style={{
                  backgroundColor: COLORS.primary,
                  color: COLORS.surface,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.text;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.primary;
                }}
              >
                Open the studio
              </Link>
            </div>
          </div>

          {/* Studio preview mockup */}
          <div className="w-full md:w-1/2 relative flex items-center justify-center p-8 lg:p-12">
            <div
              className="w-full rounded-lg overflow-hidden"
              style={{
                backgroundColor: COLORS.surface,
                boxShadow: '0 12px 32px rgba(26,26,26,0.12)',
              }}
            >
              {/* Mock browser chrome */}
              <div
                className="flex items-center gap-1.5 px-4 py-2.5 border-b"
                style={{
                  backgroundColor: COLORS.bg,
                  borderColor: `${COLORS.text}14`,
                }}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ff6057' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#27c93f' }} />
                <div
                  className="ml-4 flex-1 py-1 px-3 rounded text-xs font-mono"
                  style={{
                    backgroundColor: COLORS.surface,
                    color: COLORS.textDim,
                  }}
                >
                  quiltcorgi.com/studio
                </div>
              </div>
              {/* Studio quilt preview */}
              <div
                className="aspect-[4/3] flex items-center justify-center"
                style={{ backgroundColor: COLORS.bg }}
              >
                <img
                  src="/images/quilts/studio_quilt_four_1775440582256.png"
                  alt="Quilt design created in QuiltCorgi Studio"
                  className="w-full h-full object-contain p-6"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
