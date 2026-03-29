'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Mascot from './Mascot';

function QuiltWorktableMockup() {
  return (
    <div className="w-full h-full bg-warm-surface/50 flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-10 bg-white border-b border-warm-border flex items-center px-4 justify-between z-10 shrink-0">
        <div className="flex gap-4 items-center">
          <div className="text-[10px] font-bold text-warm-text-secondary bg-warm-surface px-2 py-1 rounded">
            My_First_Quilt.qc
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Toolbar */}
        <div className="w-12 bg-white border-r border-warm-border py-2 hidden sm:flex flex-col items-center gap-3 shrink-0 z-10">
          <div className="w-8 h-8 rounded-lg bg-warm-peach/10 text-warm-peach flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="3 3 21 12 3 21 3 3" />
            </svg>
          </div>
          <div className="w-8 h-8 rounded-lg text-warm-text-muted hover:bg-warm-surface flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            </svg>
          </div>
          <div className="w-8 h-8 rounded-lg text-warm-text-muted hover:bg-warm-surface flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-[#FEFCFA] relative flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(#E8DCCB 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.3,
            }}
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative bg-white shadow-xl border border-warm-border p-2 flex"
          >
            <div className="grid grid-cols-3 gap-2 bg-warm-peach-light p-2 border-[4px] border-warm-terracotta/60">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-white flex items-center justify-center border border-warm-border/30 relative overflow-hidden"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <polygon points="0,0 50,50 0,100" fill="#FFE4D0" />
                    <polygon points="0,0 100,0 50,50" fill="#FFB085" />
                    <polygon points="100,0 100,100 50,50" fill="#C67B5C" opacity="0.8" />
                    <polygon points="0,100 100,100 50,50" fill="white" />
                  </svg>
                  {i === 4 && <div className="absolute inset-0 border-2 border-warm-peach z-10" />}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel */}
        <div className="w-48 bg-white border-l border-warm-border p-3 shrink-0 z-10 hidden sm:flex flex-col gap-4 text-xs">
          <div>
            <div className="font-bold text-warm-text mb-2">Layout Settings</div>
            <div className="h-6 bg-warm-surface rounded mb-2 flex items-center px-2 text-warm-text-muted">
              Horizontal
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="h-6 bg-warm-surface rounded flex items-center justify-center text-warm-text-muted">
                3 cols
              </div>
              <div className="h-6 bg-warm-surface rounded flex items-center justify-center text-warm-text-muted">
                3 rows
              </div>
            </div>
          </div>
          <div>
            <div className="font-bold text-warm-text mb-2">Sashing</div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 rounded border border-warm-peach bg-warm-peach flex items-center justify-center text-white">
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-warm-text-muted">Include Sashing</span>
            </div>
            <div className="h-6 bg-warm-surface rounded flex items-center px-2 text-warm-text-muted justify-between">
              <span>Width</span>
              <span className="font-mono text-[10px]">2.0&quot;</span>
            </div>
          </div>
          <div className="mt-auto">
            <button className="w-full bg-warm-peach text-warm-text font-bold py-2 rounded-md hover:bg-warm-peach-dark transition-colors shadow-sm">
              Calculate Yardage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlockWorktableMockup() {
  return (
    <div className="w-full h-full bg-warm-surface/50 flex flex-col relative overflow-hidden">
      <div className="h-10 bg-white border-b border-warm-border flex items-center px-4 justify-between z-10 shrink-0">
        <div className="text-[10px] font-bold text-warm-text-secondary bg-warm-surface px-2 py-1 rounded">
          Drafting: Custom_Star.qc
        </div>
        <div className="flex gap-2">
          <div className="w-5 h-5 rounded hover:bg-warm-peach/10 flex items-center justify-center text-warm-peach cursor-pointer">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 19V5M5 12h14" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="w-12 bg-white border-r border-warm-border py-2 hidden sm:flex flex-col items-center gap-3 shrink-0 z-10">
          <div className="w-8 h-8 rounded-lg hover:bg-warm-surface text-warm-text-muted flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="3 3 21 12 3 21 3 3" />
            </svg>
          </div>
          <div className="w-8 h-8 rounded-lg bg-warm-peach/10 text-warm-peach flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 19l7-7 3 3-7 7-3-3z" />
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
            </svg>
          </div>
        </div>

        <div className="flex-1 bg-[#FEFCFA] relative flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(#E8DCCB 1px, transparent 1px)',
              backgroundSize: '10px 10px',
              opacity: 0.3,
            }}
          />

          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="relative w-64 h-64 bg-white shadow-md border border-warm-border/30 flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M25 0 V100 M50 0 V100 M75 0 V100 M0 25 H100 M0 50 H100 M0 75 H100"
                stroke="#E8DCCB"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                opacity="0.5"
              />
              <polygon points="50,0 100,50 50,100 0,50" fill="#FFE4D0" opacity="0.4" />
              <polygon points="50,0 75,25 50,50 25,25" fill="#FFB085" opacity="0.8" />
              <polygon points="50,50 75,75 50,100 25,75" fill="#C67B5C" opacity="0.8" />
              <line x1="25" y1="25" x2="10" y2="10" stroke="#D4726A" strokeWidth="1.5" />
              <circle cx="25" cy="25" r="2" fill="white" stroke="#FFB085" strokeWidth="1" />
              <circle cx="10" cy="10" r="2" fill="#D4726A" />
              <circle cx="50" cy="0" r="2" fill="white" stroke="#FFB085" strokeWidth="1" />
              <circle cx="50" cy="50" r="2" fill="white" stroke="#FFB085" strokeWidth="1" />
            </svg>
            <div className="absolute top-2 left-2 bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded shadow-xl">
              Snap to Grid (Intersect)
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function ImageWorktableMockup() {
  return (
    <div className="w-full h-full bg-warm-surface/50 flex flex-col relative overflow-hidden">
      <div className="h-10 bg-white border-b border-warm-border flex items-center px-4 justify-between z-10 shrink-0">
        <div className="text-[10px] font-bold text-warm-text-secondary bg-warm-surface px-2 py-1 rounded">
          Fabric: Vintage_Floral.jpg
        </div>
        <div className="px-2 py-1 bg-warm-peach text-warm-text text-[10px] font-bold rounded cursor-pointer shadow-sm">
          Save Fabric
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 bg-warm-surface relative flex items-center justify-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-72 h-48 bg-white shadow-xl overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-80"
              style={{
                backgroundColor: '#e6d5c3',
                backgroundImage:
                  'radial-gradient(#ab7746 2px, transparent 2px), radial-gradient(#ab7746 2px, transparent 2px)',
                backgroundSize: '30px 30px',
                backgroundPosition: '0 0, 15px 15px',
              }}
            />
            <div className="absolute inset-0 bg-black/40 z-10" />
            <motion.div
              animate={{ width: ['40%', '42%', '40%'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] z-20 outline outline-2 outline-white"
              style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' }}
            >
              <div
                className="w-full h-full border border-white/50"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '33.33% 33.33%',
                }}
              />
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-gray-300" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-gray-300" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-gray-300" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-gray-300" />
            </motion.div>
          </motion.div>
        </div>

        <div className="w-48 bg-white border-l border-warm-border p-3 shrink-0 z-10 hidden sm:flex flex-col gap-4 text-xs">
          <div>
            <div className="font-bold text-warm-text mb-2">Real Width Calibration</div>
            <p className="text-[9px] text-warm-text-muted mb-2 leading-tight">
              Drag the crop box to cover exactly 1 inch of physical fabric.
            </p>
            <div className="h-7 bg-warm-surface rounded border border-warm-border flex items-center px-2 text-warm-text font-mono justify-between">
              <span>Width</span>
              <span>1.0&quot;</span>
            </div>
          </div>
          <div>
            <div className="font-bold text-warm-text mb-2">Adjustments</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[10px] text-warm-text-muted mb-1">
                  <span>Brightness</span>
                  <span>+12</span>
                </div>
                <div className="h-1 bg-warm-surface rounded overflow-hidden">
                  <div className="w-[60%] h-full bg-warm-peach" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-warm-text-muted mb-1">
                  <span>Contrast</span>
                  <span>-5</span>
                </div>
                <div className="h-1 bg-warm-surface rounded overflow-hidden">
                  <div className="w-[45%] h-full bg-warm-peach" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintWorktableMockup() {
  return (
    <div className="w-full h-full bg-warm-surface/50 flex flex-col relative overflow-hidden">
      <div className="h-10 bg-white border-b border-warm-border flex items-center px-4 justify-between z-10 shrink-0">
        <div className="text-[10px] font-bold text-warm-text-secondary bg-warm-surface px-2 py-1 rounded">
          Print: Star_Pattern_Export.pdf
        </div>
        <div className="px-2 py-1 bg-warm-peach text-warm-text text-[10px] font-bold rounded cursor-pointer shadow-sm">
          Export PDF
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 bg-[#f0f0f0] relative flex items-center justify-center overflow-hidden p-6">
          {/* PDF page mockup */}
          <div className="bg-white shadow-2xl aspect-[8.5/11] h-full max-h-[300px] border border-gray-200 p-4 flex flex-col">
            <div
              className="text-[8px] font-bold text-warm-text mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Quilt Pattern — True Scale 1:1
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="border border-dashed border-warm-border p-1">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="0,0 100,0 50,50" fill="#FFB085" />
                  <polygon points="0,0 50,50 0,100" fill="#FFE4D0" />
                  <polygon points="100,0 100,100 50,50" fill="#C67B5C" opacity="0.7" />
                  <polygon points="0,100 100,100 50,50" fill="white" />
                  <rect
                    x="0"
                    y="0"
                    width="100"
                    height="100"
                    fill="none"
                    stroke="#E8DCCB"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                  />
                </svg>
              </div>
              <div className="border border-dashed border-warm-border p-1">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="5" y="5" width="90" height="90" fill="#FFE4D0" />
                  <line
                    x1="5"
                    y1="5"
                    x2="95"
                    y2="95"
                    stroke="#E8DCCB"
                    strokeWidth="0.5"
                    strokeDasharray="3 3"
                  />
                  <rect
                    x="0"
                    y="0"
                    width="100"
                    height="100"
                    fill="none"
                    stroke="#E8DCCB"
                    strokeWidth="1"
                    strokeDasharray="4 2"
                  />
                </svg>
              </div>
            </div>
            <div className="mt-2 flex justify-between text-[6px] text-warm-text-muted">
              <span>Seam allowance: 1/4&quot;</span>
              <span>Page 1 of 4</span>
            </div>
          </div>
        </div>

        <div className="w-48 bg-white border-l border-warm-border p-3 shrink-0 z-10 hidden sm:flex flex-col gap-4 text-xs">
          <div>
            <div className="font-bold text-warm-text mb-2">Export Settings</div>
            <div className="h-6 bg-warm-surface rounded flex items-center px-2 text-warm-text-muted mb-2">
              PDF (True Scale)
            </div>
            <div className="h-6 bg-warm-surface rounded flex items-center px-2 text-warm-text-muted justify-between">
              <span>Seam</span>
              <span className="font-mono text-[10px]">1/4&quot;</span>
            </div>
          </div>
          <div>
            <div className="font-bold text-warm-text mb-2">Includes</div>
            <div className="space-y-1.5 text-[10px] text-warm-text-muted">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border border-warm-peach bg-warm-peach flex items-center justify-center text-white">
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                Cutting instructions
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border border-warm-peach bg-warm-peach flex items-center justify-center text-white">
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                Yardage summary
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border border-warm-peach bg-warm-peach flex items-center justify-center text-white">
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                Seam allowances
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const tabs = [
  {
    id: 'quilt',
    label: 'Quilt Worktable',
    shortLabel: 'Quilt',
    caption:
      'Choose from six layout modes — grid, sashing, on-point, medallion, lone star, or go completely free-form.',
    component: <QuiltWorktableMockup />,
  },
  {
    id: 'block',
    label: 'Block Worktable',
    shortLabel: 'Block',
    caption:
      'Draft your own blocks with EasyDraw — snap-to-grid seam lines make precision effortless.',
    component: <BlockWorktableMockup />,
  },
  {
    id: 'image',
    label: 'Image Worktable',
    shortLabel: 'Image',
    caption:
      'Upload your fabric photos and calibrate them to real-world scale — what you see is what you sew.',
    component: <ImageWorktableMockup />,
  },
  {
    id: 'print',
    label: 'Print Worktable',
    shortLabel: 'Print',
    caption:
      'Export true 1:1 scale PDFs with cutting instructions, yardage summaries, and seam allowances included.',
    component: <PrintWorktableMockup />,
  },
];

export default function WorkspacePreview() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-warm-surface/50 to-transparent px-6 lg:px-12 text-center overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Mascot pose="licking" size="md" />
            <h2
              className="text-3xl md:text-4xl font-bold text-warm-text"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Four Worktables. One Creative Flow.
            </h2>
          </div>
          <p className="text-lg text-warm-text-secondary mb-16 max-w-2xl mx-auto">
            Each worktable handles a different stage of your quilting journey — lay out your design,
            draft custom blocks, calibrate your fabrics, and export patterns ready for the sewing
            room.
          </p>
        </motion.div>

        <div className="glass-panel rounded-[2rem] p-4 md:p-6 shadow-xl mx-auto max-w-5xl">
          {/* Tab Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-6">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === idx
                    ? 'text-warm-text'
                    : 'text-warm-text-muted hover:text-warm-text hover:bg-white/50'
                }`}
              >
                {activeTab === idx && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-warm-peach rounded-full shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                <span className="relative z-10 sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Mockup Container */}
          <div className="relative">
            <motion.div className="relative w-full aspect-square sm:aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden border border-warm-border shadow-2xl bg-white">
              {/* Browser Chrome */}
              <div className="absolute top-0 left-0 right-0 h-8 bg-warm-surface border-b border-warm-border flex items-center px-3 gap-2 z-50">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-warm-coral" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warm-golden" />
                  <div className="w-2.5 h-2.5 rounded-full bg-warm-peach" />
                </div>
                <div className="flex-1 text-center">
                  <div className="mx-auto w-48 h-5 bg-white/50 rounded-md text-[9px] font-mono text-warm-text-muted flex items-center justify-center border border-warm-border">
                    app.quiltcorgi.com/{tabs[activeTab].id}
                  </div>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 top-8 bg-warm-surface/50">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.4 }}
                    className="w-full h-full"
                  >
                    {tabs[activeTab].component}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Dynamic Caption */}
            <div className="mt-8">
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeTab}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-lg font-medium text-warm-text-secondary"
                >
                  {tabs[activeTab].caption}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
