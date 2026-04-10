'use client';

import Link from 'next/link';
import Mascot from './Mascot';
import { QuiltPiece, QuiltPieceRow } from '@/components/decorative/QuiltPiece';

function StudioMockup() {
  const toolItems = [
    { label: 'Select', active: true, icon: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /> },
    {
      label: 'Curved',
      icon: (
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      ),
    },
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
      label: 'Fabric Li...',
      icon: (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </>
      ),
    },
    {
      label: 'Photo t...',
      icon: (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </>
      ),
    },
    {
      label: 'Layout ...',
      icon: (
        <>
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </>
      ),
    },
    { label: 'Rectan...', icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /> },
    { label: 'Circle', icon: <circle cx="12" cy="12" r="10" /> },
    { label: 'Triangle', icon: <polygon points="12 2 22 20 2 20" /> },
  ];

  const panelSections = [
    { label: 'SELECTION', open: true },
    { label: 'PRECISION', open: false },
    { label: 'ROTATE & SHEAR', open: false },
    { label: 'COLOR THEME', open: false },
    { label: 'TEXT', open: false },
    { label: 'BLOCK BUILDER', open: false },
  ];

  return (
    <div className="bg-[#ffffff] rounded-lg border border-[#e8e1da]">
      {/* Top Bar */}
      <div className="h-10 bg-[#ffffff] border-b border-[#e8e1da] flex items-center px-3 gap-3 text-[10px]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-lg bg-[#fdfaf7] flex items-center justify-center text-[#6b655e]">
            <svg
              width="10"
              height="10"
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
        <div className="flex items-center gap-1 ml-2">
          <div className="px-3 py-1 bg-[#ff8d49] text-[#2d2a26] font-bold text-[9px]">
            Main
          </div>
          <div className="w-4 h-4 rounded-lg text-[#6b655e] flex items-center justify-center text-[10px]">
            +
          </div>
        </div>
        <div className="flex-1 text-center text-[#6b655e] truncate hidden sm:block">
          <span className="font-medium text-[#2d2a26]">My Quilt Project</span>
          <span className="mx-1">&middot;</span>
          <span>Quilt Canvas</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[#6b655e] hidden sm:inline">Share</span>
          <span className="text-[#6b655e] hidden sm:inline">View</span>
          <span className="text-[#6b655e] hidden sm:inline">Tools</span>
          <div className="px-3 py-1 bg-[#ff8d49] text-[#2d2a26] font-bold text-[9px]">
            Export
          </div>
        </div>
      </div>

      <div className="flex bg-[#fdfaf7] relative">
        {/* Left Toolbar with labels */}
        <div className="w-14 bg-[#ffffff] border-r border-[#e8e1da] py-2 hidden sm:flex flex-col items-center gap-0.5 shrink-0">
          {toolItems.map((tool, i) =>
            tool.divider ? (
              <div key={i} className="w-8 h-px bg-[#2d2a26]/20 my-1" />
            ) : (
              <div
                key={i}
                className={`w-12 py-1 flex flex-col items-center gap-0.5 ${tool.active ? 'text-[#ff8d49]' : 'text-[#6b655e]'
                  }`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  {tool.icon}
                </svg>
                <span className="text-[5.5px] leading-[1.1] w-full text-center whitespace-pre-line">
                  {tool.label?.replace(/\s+/g, '\n').replace(/\.\.\./g, '...')}
                </span>
              </div>
            )
          )}
        </div>

        {/* Quilt canvas */}
        <div className="flex-1 p-6 relative">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(#E8DCCB 1px, transparent 1px)',
              backgroundSize: '16px 16px',
              opacity: 0.3,
            }}
          />
          <div className="relative grid grid-cols-3 gap-2 bg-[#ffffff] p-2 border-4 border-[#ff8d49]/60 rounded-lg mx-auto max-w-[260px]">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-[#ffffff] flex items-center justify-center border border-[#2d2a26]/20"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="0,0 50,50 0,100" fill="#fed7aa" />
                  <polygon points="0,0 100,0 50,50" fill="#f97316" />
                  <polygon points="100,0 100,100 50,50" fill="#f43f5e" opacity="0.85" />
                  <polygon points="0,100 100,100 50,50" fill="white" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Accordion sections */}
        <div className="w-44 bg-[#ffffff] border-l border-[#e8e1da] shrink-0 hidden sm:flex flex-col">
          {panelSections.map((section, i) => (
            <button
              key={i}
              className="flex items-center justify-between px-3 py-2 border-b border-[#e8e1da] text-[10px] font-bold text-[#2d2a26] hover:bg-[#fdfaf7]"
            >
              <span>{section.label}</span>
              <svg
                width="10"
                height="10"
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
            </button>
          ))}
        </div>

        {/* Floating bottom toolbar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#ffffff] shadow-[0_1px_2px_rgba(45,42,38,0.08)] border border-[#e8e1da] rounded-lg px-3 py-1.5 flex items-center gap-2 z-20">
          {['Select', 'Rect', 'Tri', 'Line'].map((t, i) => (
            <div
              key={t}
              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[7px] ${i === 0 ? 'bg-[#ff8d49]/15 text-[#ff8d49]' : 'text-[#6b655e]'}`}
            >
              <svg
                width="10"
                height="10"
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
          <div className="w-px h-4 bg-[#2d2a26]/20" />
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[#6b655e]">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 10h4l3-7 4 14 3-7h4" />
            </svg>
          </div>
          <div className="w-px h-4 bg-[#2d2a26]/20" />
          <span className="text-[8px] text-[#6b655e] font-mono">48%</span>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-[#fdfaf7] rounded-b-lg px-4 py-1.5 border-t border-[#e8e1da] flex items-center justify-between text-[8px] font-mono text-[#6b655e]">
        <span>Mouse H: 12.50&quot; V: 8.25&quot;</span>
        <div className="flex gap-4">
          <span>Snap to Grid: ON</span>
          <span>Snap to Nodes: OFF</span>
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24 bg-[#fdfaf7] relative overflow-hidden">
      {/* Decorative quilt-piece backgrounds */}
      <QuiltPiece color="primary" size={180} rotation={12} top={-20} right={-30} opacity={6} />
      <QuiltPiece color="secondary" size={120} rotation={-10} bottom={40} left={-20} opacity={8} />
      <QuiltPiece color="accent" size={80} rotation={20} top="40%" right="45%" opacity={6} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <QuiltPieceRow count={3} size={8} gap={4} />
              </div>
              <h1
                className="text-[40px] leading-[52px] md:text-[48px] md:leading-[56px] lg:text-[56px] lg:leading-[64px] font-bold text-[#2d2a26]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                From First Stitch
                <span className="block text-[#ff8d49]">
                  to Finished Quilt
                </span>
              </h1>
            </div>

            <p className="text-[18px] leading-[28px] md:text-[20px] md:leading-[30px] text-[#6b655e] max-w-xl leading-relaxed">
              Design your quilt, calculate your yardage, and export true-scale patterns with seam
              allowances built in. A growing block library, and a community of quilters who get it.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-[#ff8d49] text-[#2d2a26] rounded-full font-bold text-lg hover:bg-[#e67d3f] transition-colors duration-150 text-center shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
              >
                Start Designing Free
              </Link>
            </div>
          </div>

          {/* Right - Studio Preview */}
          <div className="relative">
            {/* Mascots around the preview — hide on small screens to avoid overflow */}
            <Mascot pose="jumping" size="md" className="absolute -top-8 -left-8 z-10 hidden lg:block" />
            <Mascot pose="fetching" size="lg" className="absolute -bottom-6 -right-6 z-10 hidden lg:block" />

            <StudioMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
