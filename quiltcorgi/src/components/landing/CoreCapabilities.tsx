'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Mascot from './Mascot';

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex items-start gap-4 text-warm-text-secondary font-medium"
    >
      <div className="w-6 h-6 rounded-full bg-warm-peach/10 flex items-center justify-center text-warm-peach mt-0.5 flex-shrink-0">
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

function YardageMockup() {
  return (
    <div className="glass-panel md:aspect-[4/3] rounded-3xl p-6 shadow-2xl relative overflow-hidden group">
      {/* Decorative grid background */}
      <div
        className="absolute inset-0 opacity-10 transition-transform duration-1000 group-hover:scale-105"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, #C67B5C 0, #C67B5C 1px, transparent 0, transparent 40px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-transparent z-0" />

      <div className="relative z-10 h-full flex flex-col pt-4">
        <div className="bg-white rounded-2xl shadow-xl w-full h-full border border-warm-border overflow-hidden flex flex-col">
          {/* Mockup Header */}
          <div className="h-12 border-b border-warm-border flex items-center px-4 justify-between bg-warm-surface shrink-0">
            <div className="font-bold text-sm text-warm-text flex items-center gap-2">
              <Image
                src="/icons/quilt-12-ruler-Photoroom.png"
                alt="Ruler"
                width={20}
                height={20}
                className="object-contain"
              />
              Yardage Report
            </div>
            <div className="text-[10px] bg-warm-peach/10 text-warm-peach px-2 py-1 rounded font-bold uppercase tracking-wider">
              Generated
            </div>
          </div>

          {/* Mockup Content */}
          <div className="p-5 flex-1 overflow-hidden flex flex-col gap-4">
            <div className="flex gap-4 items-center p-3 bg-warm-surface/60 rounded-xl border border-warm-border">
              <div className="w-12 h-12 bg-warm-peach rounded-lg flex items-center justify-center shadow-inner p-1.5">
                <Image
                  src="/icons/quilt-13-dashed-squares-Photoroom.png"
                  alt="Quilt squares"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-warm-text mb-1">Color A (Primary)</div>
                <div className="flex items-end justify-between">
                  <div className="text-lg font-bold text-warm-peach">
                    2.5<span className="text-xs text-warm-text-muted font-normal ml-1">yards</span>
                  </div>
                  <div className="text-[10px] text-warm-text-muted">42&quot; width</div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 items-center p-3 bg-warm-surface/60 rounded-xl border border-warm-border">
              <div className="w-12 h-12 bg-[#FFE4D0] rounded-lg flex items-center justify-center shadow-inner p-1.5">
                <Image
                  src="/icons/quilt-01-spool-Photoroom.png"
                  alt="Thread spool"
                  width={36}
                  height={36}
                  className="object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-warm-text mb-1">Color B (Accent)</div>
                <div className="flex items-end justify-between">
                  <div className="text-lg font-bold text-warm-peach">
                    1.25<span className="text-xs text-warm-text-muted font-normal ml-1">yards</span>
                  </div>
                  <div className="text-[10px] text-warm-text-muted">42&quot; width</div>
                </div>
              </div>
            </div>

            <div className="mt-2">
              <div className="text-[10px] font-bold text-warm-text-muted uppercase tracking-widest mb-2 border-b border-warm-border pb-1">
                Sub-cutting Guide
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-warm-peach" />
                  <div className="h-2 w-3/4 bg-warm-surface rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FFE4D0]" />
                  <div className="h-2 w-1/2 bg-warm-surface rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-warm-text-muted/30" />
                  <div className="h-2 w-2/3 bg-warm-surface rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating element 1 */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -right-6 top-12 glass-panel p-3 rounded-xl shadow-xl hidden lg:flex items-center gap-3 z-20"
      >
        <Image
          src="/icons/quilt-09-measuring-tape-Photoroom.png"
          alt="Measuring tape"
          width={32}
          height={32}
          className="object-contain"
        />
        <div>
          <div className="text-[10px] text-warm-text-muted">Total Needed</div>
          <div className="font-bold text-sm text-warm-text">3.75 yds</div>
        </div>
      </motion.div>

      {/* Floating element 2 */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -left-8 bottom-20 glass-panel p-3 rounded-xl shadow-xl hidden lg:flex items-center gap-2 z-20"
      >
        <Image
          src="/icons/quilt-05-bobbin-Photoroom.png"
          alt="Bobbin"
          width={28}
          height={28}
          className="object-contain"
        />
        <div>
          <div className="font-bold text-xs text-warm-text">Auto-calculated</div>
          <div className="text-[9px] text-warm-text-muted">Includes seam allowance</div>
        </div>
      </motion.div>
    </div>
  );
}

export default function CoreCapabilities() {
  return (
    <section className="py-16 lg:py-24 px-6 lg:px-12 relative bg-warm-bg overflow-x-clip">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-warm-peach/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-warm-text-secondary/5 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/3" />

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
                className="text-3xl md:text-4xl font-bold text-warm-text leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Tools quilters actually need.
                <br />
                <span className="text-warm-peach">Built by quilters who care.</span>
              </h2>
            </div>

            <p className="text-lg text-warm-text-secondary mb-8">
              Whether you&apos;re converting a favorite photo into a patchwork design, positioning
              fabric motifs with Fussy Cut, or letting the Serendipity Generator surprise you with
              unexpected color combinations — every tool is made to help you create something
              you&apos;ll be proud of.
            </p>

            <ul className="space-y-4 mb-10">
              <CheckItem>Yardage calculations and sub-cutting charts — done for you</CheckItem>
              <CheckItem>Fussy Cut previewing and Photo Patchwork conversion</CheckItem>
              <CheckItem>True 1:1 scale PDF patterns with seam allowances</CheckItem>
              <CheckItem>EasyDraw for drafting custom blocks by seam line</CheckItem>
              <CheckItem>Applique layering and one-click Colorway recoloring</CheckItem>
              <CheckItem>Foundation Paper Piecing templates and rotary charts</CheckItem>
              <CheckItem>Snap a photo of a quilt and recreate it digitally (Pro)</CheckItem>
              <CheckItem>Six layout modes on an infinite canvas</CheckItem>
            </ul>

            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center bg-warm-peach text-warm-text font-bold px-8 py-4 rounded-full text-lg shadow-lg hover:bg-warm-peach-dark transition-all duration-300 transform hover:-translate-y-0.5"
            >
              See What You Can Create
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <YardageMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
