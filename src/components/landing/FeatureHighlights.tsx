'use client';

import Image from 'next/image';
import Mascot from './Mascot';
import { QuiltPiece, QuiltPieceRow } from '@/components/decorative/QuiltPiece';

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <div className="w-4 h-4 rounded-full bg-[#ff8d49]/10 flex items-center justify-center flex-shrink-0">
        <svg className="w-2.5 h-2.5 text-[#ff8d49]" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </div>
      {children}
    </li>
  );
}

const features = [
  {
    title: 'Your Design Studio',
    description:
      'One creative flow. Lay out your quilt, draft custom blocks with snap-to-grid precision, and choose from six layout presets including sashing and on-point.',
    iconSrc: '/icons/quilt-13-dashed-squares-Photoroom.png',
    iconAlt: 'Quilt layout squares',
    checks: ['Single persistent canvas', 'Growing block library', '6 layout presets'],
  },
  {
    title: 'Yardage & Cutting Made Easy',
    description:
      'No more guesswork at the fabric counter. QuiltCorgi calculates your yardage, generates sub-cutting charts, and even calibrates imported fabric photos to real-world scale.',
    iconSrc: '/icons/quilt-09-measuring-tape-Photoroom.png',
    iconAlt: 'Measuring tape',
    checks: [
      'Automatic yardage estimation',
      'Sub-cutting & rotary charts',
      'Real-world fabric calibration',
    ],
  },
  {
    title: 'Print-Ready Patterns',
    description:
      'Export true 1:1 scale PDFs with seam allowances baked right in. Generate cutting charts and rotary templates that go straight from your printer to your sewing room.',
    iconSrc: '/icons/quilt-04-scissors-Photoroom.png',
    iconAlt: 'Quilting scissors',
    checks: [
      'True-scale PDF with seam allowances',
      'Cutting chart generation',
      'Rotary cutting charts',
    ],
  },
];

export default function FeatureHighlights() {
  return (
    <section id="features" className="px-6 lg:px-12 py-16 lg:py-24 bg-[#fdfaf7] relative overflow-hidden">
      {/* Decorative quilt-piece backgrounds - HUGE, spread out, high opacity, charcoal stitches, flush */}
      <QuiltPiece color="primary" size={500} rotation={0} top={-100} left={-100} opacity={20} strokeWidth={3} stitchGap={8} stitchColor="#2d2a26" />
      <QuiltPiece color="accent" size={400} rotation={0} bottom={-50} right={-80} opacity={22} strokeWidth={3} stitchGap={8} stitchColor="#2d2a26" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-4 mb-16">
          <Mascot pose="scratching" size="lg" />
          <div>
            <div className="flex items-center gap-2 mb-2">
              <QuiltPieceRow count={3} size={8} gap={4} />
              <h2
                className="text-[32px] leading-[40px] md:text-[36px] md:leading-[44px] font-bold text-[#2d2a26]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Your Quilt, Start to Finish
              </h2>
            </div>
            <p className="text-[18px] leading-[28px] text-[#6b655e] mt-2">
              Design, calculate, and print &mdash; all in one place
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-[#ffffff] rounded-xl border border-[#e8e1da] shadow-[0_1px_2px_rgba(45,42,38,0.08)] p-8 relative overflow-hidden hover:shadow-[0_1px_2px_rgba(45,42,38,0.12)] transition-shadow duration-150"
            >
              {/* Subtle quilt-piece decoration */}
              <div className="absolute top-2 right-2 opacity-8 pointer-events-none">
                <QuiltPiece color="secondary" size={60} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={6} />
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 mb-6">
                  <Image
                    src={feature.iconSrc}
                    alt={feature.iconAlt}
                    width={64}
                    height={64}
                    className="w-full h-full object-contain"
                  />
                </div>
                <h3
                  className="text-[24px] leading-[32px] font-bold text-[#2d2a26] mb-3"
                  style={{ fontFamily: 'var(--font-display)' }}
                >
                  {feature.title}
                </h3>
                <p className="text-[#6b655e] mb-4">{feature.description}</p>
                <ul className="space-y-2 text-[14px] leading-[20px] text-[#6b655e]">
                  {feature.checks.map((check) => (
                    <CheckItem key={check}>{check}</CheckItem>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
