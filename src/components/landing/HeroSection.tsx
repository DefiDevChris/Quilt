'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Mascot from './Mascot';

function StudioMockup() {
  return (
    <div className="bg-white rounded-2xl shadow-elevation-4 border border-warm-border overflow-hidden">
      {/* Window chrome */}
      <div className="bg-warm-surface px-4 py-3 border-b border-warm-border flex items-center gap-3">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-warm-terracotta" />
          <div className="w-3 h-3 rounded-full bg-warm-golden" />
          <div className="w-3 h-3 rounded-full bg-warm-peach" />
        </div>
        <span className="text-sm text-warm-text-secondary">My_Quilt_Project.qc</span>
      </div>

      {/* Canvas with quilt layout mockup */}
      <div className="flex bg-[#FEFCFA]">
        {/* Tool rail */}
        <div className="w-12 bg-warm-surface/60 border-r border-warm-border py-3 flex flex-col items-center gap-3">
          {[
            <svg
              key="sel"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
            </svg>,
            <svg
              key="grid"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>,
            <svg
              key="pen"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            </svg>,
          ].map((icon, i) => (
            <div
              key={i}
              className={`w-8 h-8 flex items-center justify-center rounded-lg ${
                i === 1 ? 'bg-warm-peach/10 text-warm-peach' : 'text-warm-text-muted'
              }`}
            >
              {icon}
            </div>
          ))}
        </div>

        {/* Quilt canvas */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-3 gap-2 bg-warm-peach-light p-2 border-[3px] border-warm-terracotta/60 mx-auto max-w-[260px]">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-white flex items-center justify-center border border-warm-border/30 overflow-hidden"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="0,0 50,50 0,100" fill="#ffdfc4" />
                  <polygon points="0,0 100,0 50,50" fill="#FFB085" />
                  <polygon points="100,0 100,100 50,50" fill="#C67B5C" opacity="0.8" />
                  <polygon points="0,100 100,100 50,50" fill="white" />
                </svg>
              </div>
            ))}
          </div>
        </div>

        {/* Properties panel */}
        <div className="w-40 bg-white border-l border-warm-border p-3 hidden sm:flex flex-col gap-3 text-xs">
          <div className="font-bold text-warm-text text-[10px]">Layout</div>
          <div className="h-6 bg-warm-surface rounded flex items-center px-2 text-warm-text-muted">
            Grid 3 x 3
          </div>
          <div className="font-bold text-warm-text text-[10px]">Sashing</div>
          <div className="flex gap-2">
            {['#FFB085', '#FFD166', '#C67B5C', '#E07B67', '#4A3B32'].map((color, i) => (
              <div
                key={i}
                className="w-5 h-5 rounded-full border border-warm-border"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <div className="font-bold text-warm-text text-[10px]">Size</div>
          <div className="h-6 bg-warm-surface rounded flex items-center px-2 text-warm-text-muted font-mono text-[10px]">
            36&quot; x 45&quot;
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="bg-warm-surface px-4 py-2 border-t border-warm-border flex items-center justify-between">
        <div className="flex gap-2">
          {['#FFB085', '#FFD166', '#C67B5C', '#E07B67', '#4A3B32'].map((color, i) => (
            <div
              key={i}
              className="w-5 h-5 rounded-full border border-warm-border"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroSection() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-24 bg-warm-bg relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left - Text */}
          <div className="space-y-8">
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-warm-text leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              From First Stitch
              <span className="block text-warm-peach">to Finished Quilt</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-warm-text-secondary max-w-xl leading-relaxed"
            >
              Design your quilt, pick your fabrics, calculate your yardage, and export true-scale
              patterns with seam allowances built in. Four worktables, 659+ blocks, and a community
              of quilters who get it.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link
                href="/auth/signup"
                className="px-8 py-4 bg-warm-peach text-warm-text rounded-full font-bold text-lg hover:bg-warm-peach-dark transition-all shadow-elevation-3 text-center"
              >
                Start Designing Free
              </Link>
            </motion.div>
          </div>

          {/* Right - Studio Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 50 }}
            className="relative"
          >
            {/* Mascots around the preview — hide on small screens to avoid overflow */}
            <div className="absolute -top-8 -left-8 z-10 hidden lg:block">
              <Mascot pose="jumping" size="md" className="drop-shadow-elevation-3" />
            </div>
            <div className="absolute -bottom-6 -right-6 z-10 hidden lg:block">
              <Mascot pose="fetching" size="lg" className="drop-shadow-elevation-3" />
            </div>

            <StudioMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
