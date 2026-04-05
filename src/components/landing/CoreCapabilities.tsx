'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Mascot from './Mascot';

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex items-start gap-4 text-secondary font-medium"
    >
      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary mt-0.5 flex-shrink-0">
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
    </motion.li>
  );
}

/* 6×6 quilt grid — a simplified Ohio Star / Nine-Patch pattern */
const QUILT_GRID: string[][] = [
  ['#FFB085', '#FFF5E6', '#C67B5C', '#FFF5E6', '#FFB085', '#FFF5E6'],
  ['#FFF5E6', '#C67B5C', '#FFB085', '#C67B5C', '#FFF5E6', '#C67B5C'],
  ['#C67B5C', '#FFB085', '#FFF5E6', '#FFB085', '#C67B5C', '#FFB085'],
  ['#FFF5E6', '#C67B5C', '#FFB085', '#C67B5C', '#FFF5E6', '#C67B5C'],
  ['#FFB085', '#FFF5E6', '#C67B5C', '#FFF5E6', '#FFB085', '#FFF5E6'],
  ['#FFF5E6', '#C67B5C', '#FFB085', '#C67B5C', '#FFF5E6', '#C67B5C'],
];

function StudioPreviewMockup() {
  return (
    <div className="relative group">
      {/* Studio window — sits directly on the page background, no outer container */}
      <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(74,59,50,0.12)] w-full border border-outline-variant overflow-hidden flex flex-col">
        {/* Studio Top Bar */}
        <div className="h-10 border-b border-outline-variant flex items-center px-3 justify-between bg-surface-container shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
            </div>
            <span className="text-caption font-bold text-tertiary ml-2">Ohio Star Throw</span>
          </div>
          <div className="flex items-center gap-1.5">
            {['Quilt', 'Block', 'Print'].map((tab, i) => (
              <div
                key={tab}
                className={`text-caption font-bold px-2 py-0.5 rounded ${
                  i === 0 ? 'bg-primary/15 text-primary' : 'text-tertiary'
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>

        <div className="flex" style={{ minHeight: '280px' }}>
          {/* Mini Tool Rail */}
          <div className="w-9 border-r border-outline-variant bg-white py-2 hidden sm:flex flex-col items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 3l14 9-6 2-4 7-4-18z" />
              </svg>
            </div>
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-tertiary">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
              </svg>
            </div>
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-tertiary">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="2" y="2" width="20" height="20" rx="3" />
                <path d="M2 12h20M12 2v20" />
              </svg>
            </div>
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-tertiary">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 3H3v18h18V3zM9 3v18M15 3v18M3 9h18M3 15h18" />
              </svg>
            </div>
            <div className="w-5 border-t border-outline-variant mt-1 mb-1" />
            <div className="w-6 h-6 rounded-md flex items-center justify-center text-tertiary/50">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M3 10h13a4 4 0 010 8H9" />
                <path d="M7 6l-4 4 4 4" />
              </svg>
            </div>
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex items-center justify-center p-5 bg-gradient-to-br from-surface-container/30 to-white/20 relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-caption font-mono text-tertiary/60">
              54&quot; × 54&quot;
            </div>
            <div className="grid grid-cols-6 gap-[2px] p-[2px] bg-on-surface/10 rounded-sm shadow-elevation-2 w-full max-w-[220px] aspect-square">
              {QUILT_GRID.flat().map((color, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.015, duration: 0.3 }}
                  className="aspect-square rounded-[1px]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-caption font-bold text-tertiary/50 uppercase tracking-widest">
              Grid Layout • 9&quot; blocks
            </div>
          </div>

          {/* Right context panel */}
          <div className="w-[120px] border-l border-outline-variant bg-surface-container/40 p-2.5 hidden md:flex flex-col gap-2 shrink-0 overflow-hidden">
            <div className="text-caption font-bold text-tertiary uppercase tracking-wider">
              Fabrics
            </div>
            {[
              { fabric: 'Warm Peach', color: '#FFB085', pieces: 12 },
              { fabric: 'Rust', color: '#C67B5C', pieces: 12 },
              { fabric: 'Cream', color: '#FFF5E6', pieces: 12 },
            ].map((item) => (
              <div key={item.fabric} className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded-sm border border-outline-variant shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="min-w-0">
                  <div className="text-caption font-medium text-on-surface truncate">
                    {item.fabric}
                  </div>
                  <div className="text-caption text-tertiary">{item.pieces} pcs</div>
                </div>
              </div>
            ))}
            <div className="border-t border-outline-variant pt-1.5 mt-1">
              <div className="text-caption font-bold text-tertiary uppercase tracking-wider mb-1">
                Layout
              </div>
              <div className="text-caption text-on-surface">6 × 6 grid</div>
              <div className="text-caption text-tertiary">½&quot; seam allowance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CoreCapabilities() {
  return (
    <section className="py-16 lg:py-24 px-6 lg:px-12 relative bg-background overflow-x-clip">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-6">
              <Mascot pose="sitting" size="lg" />
              <h2
                className="text-3xl md:text-4xl font-bold text-on-surface leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Tools quilters actually need.
                <br />
                <span className="text-primary">
                  Say goodbye to guesswork and expensive software.
                </span>
              </h2>
            </div>

            <p className="text-lg text-secondary mb-8">
              Whether you&apos;re turning photos into quilt patterns with a click, drafting custom
              blocks with snap-to-grid precision, or exploring unexpected color combinations — every
              tool is made to help you create something you&apos;ll be proud of.
            </p>

            <ul className="space-y-4 mb-10">
              <CheckItem>Turn any photo into a block-by-block quilt pattern (Pro)</CheckItem>
              <CheckItem>105+ quilt blocks to browse, customize, and use</CheckItem>
              <CheckItem>Yardage calculations and sub-cutting charts — done for you</CheckItem>
              <CheckItem>True 1:1 scale PDF patterns with seam allowances</CheckItem>
              <CheckItem>Block drafting with snap-to-grid precision</CheckItem>
              <CheckItem>Six layout modes on an infinite canvas</CheckItem>
              <CheckItem>Fabric pattern adjustments and real-world calibration</CheckItem>
              <CheckItem>Foundation Paper Piecing templates and rotary charts</CheckItem>
            </ul>

            <Link href="/auth/signup" className="btn-primary">
              See What You Can Create
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className={'relative'}
          >
            <StudioPreviewMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
