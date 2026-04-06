'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Mascot from './Mascot';

function MockTopBar({ worktable }: { worktable: string }) {
  return (
    <div className="h-8 bg-white border-b border-outline-variant flex items-center px-2 gap-2 text-[8px] shrink-0 z-20">
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded bg-surface-container flex items-center justify-center text-tertiary">
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
        <span className="font-bold text-on-surface hidden md:inline text-[9px]">QuiltCorgi</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="px-2 py-0.5 bg-primary/20 text-on-surface rounded-full font-bold text-[8px]">
          {worktable}
        </div>
        <span className="text-tertiary text-caption">+</span>
      </div>
      <div className="flex-1 text-center text-tertiary truncate hidden md:block">
        <span className="font-medium text-on-surface text-[9px]">My Quilt</span>
        <span className="mx-1">·</span>
        <span>{worktable} Canvas</span>
      </div>
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-tertiary hidden md:inline">Share</span>
        <span className="text-tertiary hidden md:inline">View</span>
        <span className="text-tertiary hidden md:inline">Tools</span>
        <div className="px-2 py-0.5 bg-on-surface text-white rounded font-bold text-[8px]">
          Export
        </div>
      </div>
    </div>
  );
}

type ToolItem = { label: string; icon: React.ReactNode; active?: boolean };
type ToolSection = { header: string; tools: ToolItem[] };

function MockToolbar({ sections }: { sections: ToolSection[] }) {
  return (
    <div className="w-[4.5rem] bg-white border-r border-outline-variant py-1.5 px-1 hidden sm:flex flex-col gap-1 shrink-0 z-10 overflow-y-auto">
      {sections.map((section, si) => (
        <div key={si}>
          <div className="text-[5px] font-bold text-tertiary tracking-widest uppercase px-1 mb-0.5">
            {section.header}
          </div>
          <div className="grid grid-cols-2 gap-0.5">
            {section.tools.map((tool, ti) => (
              <div
                key={ti}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-lg ${
                  tool.active ? 'bg-primary/10 text-primary' : 'text-tertiary'
                }`}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  {tool.icon}
                </svg>
                <span className="text-[4.5px] leading-[1.1] w-full text-center whitespace-pre-line">
                  {tool.label.replace(/\s+/g, '\n').replace(/\.\.\./g, '...')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MockAccordionPanel({
  sections,
}: {
  sections: { label: string; open?: boolean; expanded?: boolean }[];
}) {
  return (
    <div className="w-44 bg-white border-l border-outline-variant shrink-0 z-10 hidden sm:flex flex-col gap-1 p-1.5 overflow-y-auto">
      {sections.map((section, i) => (
        <div key={i} className="rounded-lg border border-outline-variant overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[8px] font-bold text-on-surface tracking-wide bg-white">
            <span>{section.label}</span>
            <svg
              width="8"
              height="8"
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
          {section.expanded && (
            <div className="px-2.5 pb-2 text-[7px] text-tertiary border-t border-outline-variant/50">
              <div className="mt-1.5 mb-1 text-[7px] font-bold text-on-surface tracking-wide">
                PRECISION
              </div>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                <div>
                  <div className="text-[6px] text-tertiary mb-0.5">BLOCK WIDTH</div>
                  <div className="h-4 bg-surface-container rounded border border-outline-variant flex items-center px-1 text-[6px] font-mono text-on-surface">
                    48.000 in
                  </div>
                </div>
                <div>
                  <div className="text-[6px] text-tertiary mb-0.5">BLOCK HEIGHT</div>
                  <div className="h-4 bg-surface-container rounded border border-outline-variant flex items-center px-1 text-[6px] font-mono text-on-surface">
                    48.000 in
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded border border-primary bg-primary flex items-center justify-center text-white">
                  <svg
                    width="7"
                    height="7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="text-[7px] text-on-surface">Snap to Grid</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function MockFloatingToolbar() {
  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-white rounded-full shadow-elevation-4 border border-outline-variant px-2.5 py-1 flex items-center gap-1.5 z-20">
      {[
        <path key="s" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
        <rect key="r" x="3" y="3" width="18" height="18" rx="2" />,
        <polygon key="t" points="12 2 22 20 2 20" />,
        <line key="l" x1="5" y1="12" x2="19" y2="12" />,
      ].map((icon, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full flex items-center justify-center ${i === 0 ? 'bg-primary/15 text-primary' : 'text-tertiary'}`}
        >
          <svg
            width="9"
            height="9"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            {icon}
          </svg>
        </div>
      ))}
      <div className="w-px h-3 bg-outline-variant" />
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-tertiary">
        <svg
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="1 4 1 10 7 10" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      </div>
      <div className="w-px h-3 bg-outline-variant" />
      <span className="text-[7px] text-tertiary font-mono">48%</span>
    </div>
  );
}

function MockStatusBar() {
  return (
    <div className="h-5 bg-surface-container/60 border-t border-outline-variant flex items-center justify-between px-3 text-[7px] font-mono text-tertiary shrink-0">
      <span>Mouse H: 12.50&quot; V: 8.25&quot;</span>
      <div className="flex gap-3">
        <span>Snap to Grid: ON</span>
        <span>Snap to Nodes: OFF</span>
      </div>
    </div>
  );
}

const quiltToolSections: ToolSection[] = [
  {
    header: 'TOOLS',
    tools: [
      {
        label: 'Select',
        icon: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
        active: true,
      },
      {
        label: 'Curved Ed...',
        icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8" />,
      },
      {
        label: 'Pan',
        icon: (
          <>
            <path d="M18 11V6a2 2 0 0 0-4 0v1" />
            <path d="M14 10V4a2 2 0 0 0-4 0v2" />
            <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
            <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.9-5.7-2.4L3.5 15" />
          </>
        ),
      },
      {
        label: 'Block Libra...',
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
        label: 'Fabric Libr...',
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </>
        ),
      },
      {
        label: 'Photo to P...',
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </>
        ),
      },
      {
        label: 'Layout Set...',
        icon: (
          <>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </>
        ),
      },
    ],
  },
  {
    header: 'PATTERN',
    tools: [
      {
        label: 'Blocks',
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </>
        ),
      },
      {
        label: 'Borders',
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </>
        ),
      },
      {
        label: 'Hedging',
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </>
        ),
      },
      {
        label: 'Sashing',
        icon: (
          <>
            <path d="M21 3H3v18h18V3zM9 3v18M15 3v18M3 9h18M3 15h18" />
          </>
        ),
      },
      {
        label: 'Grid & Dim...',
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="3" />
          </>
        ),
      },
    ],
  },
];

const quiltPanelSections = [
  { label: 'SELECTION', open: true },
  { label: 'PRECISION', open: true, expanded: true },
  { label: 'ROTATE & SHEAR' },
  { label: 'COLOR THEME' },
  { label: 'TEXT' },
  { label: 'BLOCK BUILDER' },
];

function QuiltWorktableMockup() {
  return (
    <div className="w-full h-full bg-surface-container/50 flex flex-col relative overflow-hidden">
      <MockTopBar worktable="Main" />
      <div className="flex flex-1 overflow-hidden relative">
        <MockToolbar sections={quiltToolSections} />

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
            className="relative bg-white shadow-elevation-4 border border-outline-variant p-2 flex"
          >
            <div className="grid grid-cols-3 gap-2 bg-primary-container p-2 border-[4px] border-primary-dark/60">
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-white flex items-center justify-center border border-outline-variant/30 relative overflow-hidden"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <polygon points="0,0 50,50 0,100" fill="#FFE4D0" />
                    <polygon points="0,0 100,0 50,50" fill="#FFB085" />
                    <polygon points="100,0 100,100 50,50" fill="#C67B5C" opacity="0.8" />
                    <polygon points="0,100 100,100 50,50" fill="white" />
                  </svg>
                  {i === 4 && <div className="absolute inset-0 border-2 border-primary z-10" />}
                </div>
              ))}
            </div>
          </motion.div>

          <MockFloatingToolbar />
        </div>

        <MockAccordionPanel sections={quiltPanelSections} />
      </div>
      <MockStatusBar />
    </div>
  );
}

const blockToolSections: ToolSection[] = [
  {
    header: 'TOOLS',
    tools: [
      { label: 'Select', icon: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /> },
      {
        label: 'Curved Ed...',
        icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8" />,
      },
      { label: 'Easy Draw', icon: <path d="M12 19l7-7 3 3-7 7-3-3z" />, active: true },
    ],
  },
  {
    header: 'SHAPES',
    tools: [
      { label: 'Rectangle', icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /> },
      { label: 'Circle', icon: <circle cx="12" cy="12" r="10" /> },
      { label: 'Triangle', icon: <polygon points="12 2 22 20 2 20" /> },
      { label: 'Line', icon: <line x1="5" y1="12" x2="19" y2="12" /> },
      {
        label: 'Grid & Dim...',
        icon: (
          <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="3" />
          </>
        ),
      },
    ],
  },
];

const blockPanelSections = [
  { label: 'SELECTION', open: true },
  { label: 'PRECISION' },
  { label: 'ROTATE & SHEAR' },
  { label: 'COLOR THEME' },
  { label: 'BLOCK BUILDER', open: true },
];

function BlockWorktableMockup() {
  return (
    <div className="w-full h-full bg-surface-container/50 flex flex-col relative overflow-hidden">
      <MockTopBar worktable="Block" />
      <div className="flex flex-1 overflow-hidden relative">
        <MockToolbar sections={blockToolSections} />

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
            className="relative w-64 h-64 bg-white shadow-elevation-2 border border-outline-variant/30 flex items-center justify-center"
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
            <div className="absolute top-2 left-2 bg-surface-container900 text-white text-[8px] px-1.5 py-0.5 rounded shadow-elevation-4">
              Snap to Grid (Intersect)
            </div>
          </motion.div>

          <MockFloatingToolbar />
        </div>

        <MockAccordionPanel sections={blockPanelSections} />
      </div>
      <MockStatusBar />
    </div>
  );
}

const imagePanelSections = [
  { label: 'CALIBRATION', open: true },
  { label: 'ADJUSTMENTS', open: true },
  { label: 'CROP' },
  { label: 'COLOR THEME' },
];

function ImageWorktableMockup() {
  return (
    <div className="w-full h-full bg-surface-container/50 flex flex-col relative overflow-hidden">
      <MockTopBar worktable="Image" />
      <div className="flex flex-1 overflow-hidden relative">
        <MockToolbar
          sections={[
            {
              header: 'TOOLS',
              tools: [
                {
                  label: 'Select',
                  icon: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
                  active: true,
                },
                {
                  label: 'Crop',
                  icon: (
                    <>
                      <path d="M6 2v14a2 2 0 0 0 2 2h14" />
                      <path d="M18 22V8a2 2 0 0 0-2-2H2" />
                    </>
                  ),
                },
              ],
            },
            {
              header: 'SHAPES',
              tools: [
                {
                  label: 'Rectangle',
                  icon: <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />,
                },
                { label: 'Circle', icon: <circle cx="12" cy="12" r="10" /> },
                { label: 'Line', icon: <line x1="5" y1="12" x2="19" y2="12" /> },
              ],
            },
          ]}
        />

        <div className="flex-1 bg-surface-container relative flex items-center justify-center overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative w-72 h-48 bg-white shadow-elevation-4 overflow-hidden"
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
            <div
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
            </div>
          </motion.div>

          <MockFloatingToolbar />
        </div>

        <MockAccordionPanel sections={imagePanelSections} />
      </div>
      <MockStatusBar />
    </div>
  );
}

const printPanelSections = [
  { label: 'EXPORT SETTINGS', open: true },
  { label: 'PAGE LAYOUT' },
  { label: 'INCLUDES', open: true },
  { label: 'CUTTING CHARTS' },
];

function PrintWorktableMockup() {
  return (
    <div className="w-full h-full bg-surface-container/50 flex flex-col relative overflow-hidden">
      <MockTopBar worktable="Print" />
      <div className="flex flex-1 overflow-hidden relative">
        <MockToolbar
          sections={[
            {
              header: 'TOOLS',
              tools: [
                {
                  label: 'Select',
                  icon: <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
                  active: true,
                },
                {
                  label: 'Zoom',
                  icon: (
                    <>
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </>
                  ),
                },
                {
                  label: 'Page...',
                  icon: (
                    <>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </>
                  ),
                },
              ],
            },
          ]}
        />

        <div className="flex-1 bg-[#f0f0f0] relative flex items-center justify-center overflow-hidden p-6">
          <div className="bg-white shadow-elevation-4 aspect-[8.5/11] h-full max-h-[300px] border border-gray-200 p-4 flex flex-col">
            <div
              className="text-[8px] font-bold text-on-surface mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Quilt Pattern — True Scale 1:1
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="border border-dashed border-outline-variant p-1">
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
              <div className="border border-dashed border-outline-variant p-1">
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
            <div className="mt-2 flex justify-between text-[6px] text-tertiary">
              <span>Seam allowance: 1/4&quot;</span>
              <span>Page 1 of 4</span>
            </div>
          </div>

          <MockFloatingToolbar />
        </div>

        <MockAccordionPanel sections={printPanelSections} />
      </div>
      <MockStatusBar />
    </div>
  );
}

const tabs = [
  {
    id: 'quilt',
    label: 'Quilt Worktable',
    shortLabel: 'Quilt',
    caption: 'Choose from four layout modes — grid, sashing, on-point, or go completely free-form.',
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
    <section className="py-16 lg:py-24 bg-gradient-to-b from-surface-container/50 to-transparent px-6 lg:px-12 text-center overflow-hidden">
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
              className="text-3xl md:text-4xl font-bold text-on-surface"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Four Worktables. One Creative Flow.
            </h2>
          </div>
          <p className="text-lg text-secondary mb-16 max-w-2xl mx-auto">
            Each worktable handles a different stage of your quilting journey — lay out your design,
            draft custom blocks, calibrate your fabrics, and export patterns ready for the sewing
            room.
          </p>
        </motion.div>

        <div className="mx-auto max-w-5xl">
          {/* Tab Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-6">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === idx
                    ? 'text-on-surface'
                    : 'text-tertiary hover:text-on-surface hover:bg-white/50'
                }`}
              >
                {activeTab === idx && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-primary rounded-full shadow-elevation-1"
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
            <motion.div className="relative w-full aspect-square sm:aspect-[4/3] md:aspect-[16/9] rounded-xl overflow-hidden border border-outline-variant shadow-elevation-4 bg-white">
              <div className="absolute inset-0 bg-surface-container/50">
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
                  className="text-lg font-medium text-secondary"
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
