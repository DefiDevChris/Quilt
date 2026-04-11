'use client';

import Link from 'next/link';
import Mascot from './Mascot';
import { QuiltPiece, QuiltPieceRow } from '@/components/decorative/QuiltPiece';

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4 text-[#6b655e] font-medium">
      <div className="w-6 h-6 rounded-full bg-[#ff8d49]/10 flex items-center justify-center text-[#ff8d49] mt-0.5 flex-shrink-0">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <span className="leading-snug">{children}</span>
    </li>
  );
}

/* 6x6 quilt grid -- a simplified Ohio Star / Nine-Patch pattern */
const QUILT_GRID: string[][] = [
  ['#FFB085', '#FFF5E6', '#C67B5C', '#FFF5E6', '#FFB085', '#FFF5E6'],
  ['#FFF5E6', '#C67B5C', '#FFB085', '#C67B5C', '#FFF5E6', '#C67B5C'],
  ['#C67B5C', '#FFB085', '#FFF5E6', '#FFB085', '#C67B5C', '#FFB085'],
  ['#FFF5E6', '#C67B5C', '#FFB085', '#C67B5C', '#FFF5E6', '#C67B5C'],
  ['#FFB085', '#FFF5E6', '#C67B5C', '#FFF5E6', '#FFB085', '#FFF5E6'],
  ['#FFF5E6', '#C67B5C', '#FFB085', '#C67B5C', '#FFF5E6', '#C67B5C'],
];

function StudioPreviewMockup() {
  const panelSections = [
    { label: 'SELECTION', open: true },
    { label: 'PRECISION' },
    { label: 'ROTATE & SHEAR' },
    { label: 'COLOR THEME' },
    { label: 'BLOCK BUILDER' },
  ];

  return (
    <div className="relative group">
      <div className="bg-[#ffffff] rounded-lg border border-[#e8e1da] flex flex-col">
        {/* Top Bar -- matches real studio */}
        <div className="h-9 border-b border-[#e8e1da] flex items-center px-3 gap-2 bg-[#ffffff] shrink-0 text-[9px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 bg-[#ffffff] rounded-lg border border-[#e8e1da] flex items-center justify-center text-[#6b655e]">
              <svg
                width="8"
                height="8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </div>
            <span className="font-bold text-[#2d2a26] hidden sm:inline">QuiltCorgi</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="px-2 py-0.5 bg-[#ff8d49] text-[#2d2a26] font-bold text-[8px]">
              Main
            </div>
            <span className="text-[#6b655e] text-[10px]">+</span>
          </div>
          <div className="flex-1 text-center text-[#6b655e] truncate hidden sm:block">
            <span className="font-medium text-[#2d2a26]">Ohio Star Throw</span>
            <span className="mx-1">&middot;</span>
            <span>Quilt Canvas</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-[#6b655e] hidden sm:inline">Share</span>
            <span className="text-[#6b655e] hidden sm:inline">View</span>
            <span className="text-[#6b655e] hidden sm:inline">Tools</span>
            <div className="px-2 py-0.5 bg-[#2d2a26] text-[#ffffff] font-bold text-[8px]">
              Export
            </div>
          </div>
        </div>

        <div className="flex" style={{ minHeight: '280px' }}>
          {/* Left Toolbar with labels */}
          <div className="w-12 border-r border-[#e8e1da] bg-[#ffffff] py-1 hidden sm:flex flex-col items-center gap-0.5 shrink-0">
            {[
              { label: 'Select', icon: <path d="M5 3l14 9-6 2-4 7-4-18z" />, active: true },
              { label: 'Curved', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4" /> },
              { divider: true },
              {
                label: 'Block Li...',
                icon: (
                  <>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </>
                ),
              },
              {
                label: 'Layout',
                icon: (
                  <>
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                  </>
                ),
              },
              {
                label: 'Rectan...',
                icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
              },
              { label: 'Triangle', icon: <polygon points="12 2 22 20 2 20" /> },
            ].map((tool, i) =>
              (tool as { divider?: boolean }).divider ? (
                <div key={i} className="w-7 h-px bg-[#2d2a26]/20 my-0.5" />
              ) : (
                <div
                  key={i}
                  className={`w-10 py-0.5 flex flex-col items-center gap-0.5 ${(tool as { active?: boolean }).active ? 'text-[#ff8d49]' : 'text-[#6b655e]'
                    }`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    {(tool as { icon: React.ReactNode }).icon}
                  </svg>
                  <span className="text-[5px] leading-[1.1] w-full text-center whitespace-pre-line">
                    {(tool as { label: string }).label?.replace(/\s+/g, '\n').replace(/\.\.\./g, '...')}
                  </span>
                </div>
              )
            )}
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center p-5 bg-[#fdfaf7] relative">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: 'radial-gradient(#E8DCCB 1px, transparent 1px)',
                backgroundSize: '16px 16px',
                opacity: 0.3,
              }}
            />
            <div className="relative grid grid-cols-6 gap-[2px] p-[2px] bg-[#2d2a26]/10 w-full max-w-[220px] aspect-square rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
              {QUILT_GRID.flat().map((color, i) => (
                <div
                  key={i}
                  className="aspect-square"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            {/* Floating toolbar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#ffffff] shadow-[0_1px_2px_rgba(45,42,38,0.08)] border border-[#e8e1da] rounded-lg px-2 py-1 flex items-center gap-1.5 z-10">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-5 h-5 flex items-center justify-center ${i === 0 ? 'bg-[#ff8d49]/15 text-[#ff8d49]' : 'text-[#6b655e]'}`}
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {i === 0 && <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />}
                    {i === 1 && <rect x="3" y="3" width="18" height="18" rx="2" />}
                    {i === 2 && <polygon points="12 2 22 20 2 20" />}
                    {i === 3 && <line x1="5" y1="12" x2="19" y2="12" />}
                  </svg>
                </div>
              ))}
              <div className="w-px h-3 bg-[#2d2a26]/20" />
              <span className="text-[7px] text-[#6b655e] font-mono">54%</span>
            </div>
          </div>

          {/* Right panel -- accordion sections */}
          <div className="w-[120px] border-l border-[#e8e1da] bg-[#ffffff] hidden md:flex flex-col shrink-0">
            {panelSections.map((section, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-2 py-1.5 border-b border-[#e8e1da] text-[7px] font-bold text-[#2d2a26]"
              >
                <span>{section.label}</span>
                <svg
                  width="7"
                  height="7"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  {section.open ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Status bar */}
        <div className="h-5 bg-[#fdfaf7] border-t border-[#e8e1da] flex items-center justify-between px-3 text-[7px] font-mono text-[#6b655e] shrink-0">
          <span>Mouse H: 27.00&quot; V: 27.00&quot;</span>
          <div className="flex gap-3">
            <span>Snap to Grid: ON</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoreCapabilities() {
  return (
    <section className="py-16 lg:py-24 px-6 lg:px-12 relative bg-[#fdfaf7]">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Mascot pose="sitting" size="lg" />
              <h2
                className="text-[32px] leading-[40px] md:text-[36px] md:leading-[44px] font-bold text-[#2d2a26] leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Tools quilters actually need.
                <br />
                <span className="text-[#ff8d49]">Built by quilters who care.</span>
              </h2>
            </div>

            <p className="text-[18px] leading-[28px] text-[#6b655e] mb-8">
              Whether you&apos;re snapping a photo of a quilt and recreating it digitally,
              positioning fabric motifs with precision, or drafting custom blocks in the Block Builder
              &mdash; every tool is made to help you create something you&apos;ll be proud of.
            </p>

            <ul className="space-y-4 mb-10">
              <CheckItem>Yardage calculations and sub-cutting charts &mdash; done for you</CheckItem>
              <CheckItem>Per-patch fabric assignment with pattern previews</CheckItem>
              <CheckItem>True 1:1 scale PDF patterns with seam allowances</CheckItem>
              <CheckItem>Block Builder for drafting custom blocks by seam line</CheckItem>
              <CheckItem>Photo-to-Design: extract quilt pieces from photos using OpenCV</CheckItem>
              <CheckItem>Print-ready cutting charts and rotary templates</CheckItem>
              <CheckItem>Snap a photo of a quilt and recreate it digitally (Pro)</CheckItem>
              <CheckItem>Six layout presets on a single persistent canvas</CheckItem>
            </ul>

            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center bg-[#ff8d49] text-[#2d2a26] font-bold px-8 py-4 rounded-full text-lg hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
            >
              See What You Can Create
            </Link>
          </div>

          <div className="relative">
            {/* Decorative quilt pieces around the mockup - HUGE, spread out, high opacity, charcoal stitches, flush */}
            <div className="absolute -top-6 -left-6 opacity-20 pointer-events-none">
              <QuiltPiece color="accent" size={120} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={3} stitchGap={8} />
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-18 pointer-events-none">
              <QuiltPiece color="secondary" size={100} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={3} stitchGap={8} />
            </div>
            <StudioPreviewMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
