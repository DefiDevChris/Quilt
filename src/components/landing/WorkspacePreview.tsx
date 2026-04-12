'use client';

import { useState } from 'react';
import { COLORS, SHADOW } from '@/lib/design-system';
import Mascot from './Mascot';
import { QuiltPieceRow } from '@/components/decorative/QuiltPiece';

function MockTopBar({ worktable }: { worktable: string }) {
  return (
    <div className="h-8 bg-[var(--color-bg)] border-b border-[var(--color-border)] flex items-center px-2 gap-2 text-[8px] shrink-0 z-20">
      <div className="flex items-center gap-1.5">
        <div className="w-3.5 h-3.5 rounded-lg bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-text-dim)]">
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
        <span className="font-bold text-[var(--color-text)] hidden md:inline text-[9px]">QuiltCorgi</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="px-2 py-0.5 text-[var(--color-text)] rounded-lg font-bold text-[8px]" style={{ backgroundColor: `${COLORS.primary}33` }}>
          {worktable}
        </div>
        <span className="text-[var(--color-text-dim)] text-[10px]">+</span>
      </div>
      <div className="flex-1 text-center text-[var(--color-text-dim)] truncate hidden md:block">
        <span className="font-medium text-[var(--color-text)] text-[9px]">My Quilt</span>
        <span className="mx-1">&middot;</span>
        <span>{worktable} Canvas</span>
      </div>
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-[var(--color-text-dim)] hidden md:inline">Share</span>
        <span className="text-[var(--color-text-dim)] hidden md:inline">View</span>
        <span className="text-[var(--color-text-dim)] hidden md:inline">Tools</span>
        <div className="px-2 py-0.5 bg-[var(--color-text)] text-[var(--color-surface)] rounded-lg font-bold text-[8px]">
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
    <div className="w-[4.5rem] bg-[var(--color-bg)] border-r border-[var(--color-border)] py-1.5 px-1 hidden sm:flex flex-col gap-1 shrink-0 z-10 overflow-y-auto">
      {sections.map((section, si) => (
        <div key={si}>
          <div className="text-[5px] font-bold text-[var(--color-text-dim)] px-1 mb-0.5">
            {section.header}
          </div>
          <div className="grid grid-cols-2 gap-0.5">
            {section.tools.map((tool, ti) => (
              <div
                key={ti}
                className={`flex flex-col items-center gap-0.5 py-1 rounded-full ${tool.active ? 'text-[var(--color-text)]' : 'text-[var(--color-text-dim)]'
                  }`}
                style={tool.active ? { backgroundColor: `${COLORS.primary}1a` } : undefined}
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
    <div className="w-44 bg-[var(--color-bg)] border-l border-[var(--color-border)] shrink-0 z-10 hidden sm:flex flex-col gap-1 p-1.5 overflow-y-auto">
      {sections.map((section, i) => (
        <div key={i} className="border border-[var(--color-border)] overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[8px] font-bold text-[var(--color-text)] bg-[var(--color-bg)]">
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
            <div className="px-2.5 pb-2 text-[7px] text-[var(--color-text-dim)] border-t border-[var(--color-border)]/50">
              <div className="mt-1.5 mb-1 text-[7px] font-bold text-[var(--color-text)]">
                PRECISION
              </div>
              <div className="grid grid-cols-2 gap-1 mb-1.5">
                <div>
                  <div className="text-[6px] text-[var(--color-text-dim)] mb-0.5">BLOCK WIDTH</div>
                  <div className="h-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] flex items-center px-1 text-[6px] font-mono text-[var(--color-text)]">
                    48.000 in
                  </div>
                </div>
                <div>
                  <div className="text-[6px] text-[var(--color-text-dim)] mb-0.5">BLOCK HEIGHT</div>
                  <div className="h-4 bg-[var(--color-surface)] rounded-lg border border-[var(--color-border)] flex items-center px-1 text-[6px] font-mono text-[var(--color-text)]">
                    48.000 in
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-lg flex items-center justify-center text-[var(--color-surface)]" style={{ border: `1px solid ${COLORS.primary}`, backgroundColor: COLORS.primary }}>
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
                <span className="text-[7px] text-[var(--color-text)]">Snap to Grid</span>
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
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-[var(--color-bg)] shadow-[0_1px_2px_rgba(26,26,26,0.08)] border border-[var(--color-border)] rounded-full px-2.5 py-1 flex items-center gap-1.5 z-20">
      {[
        <path key="s" d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
        <rect key="r" x="3" y="3" width="18" height="18" rx="2" />,
        <polygon key="t" points="12 2 22 20 2 20" />,
        <line key="l" x1="5" y1="12" x2="19" y2="12" />,
      ].map((icon, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full flex items-center justify-center ${i === 0 ? 'text-[var(--color-text)]' : 'text-[var(--color-text-dim)]'}`}
          style={i === 0 ? { backgroundColor: `${COLORS.primary}26` } : undefined}
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
      <div className="w-px h-3 bg-[var(--color-border)]" />
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[var(--color-text-dim)]">
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
      <div className="w-px h-3 bg-[var(--color-border)]" />
      <span className="text-[7px] text-[var(--color-text-dim)] font-mono">48%</span>
    </div>
  );
}

function MockStatusBar() {
  return (
    <div className="h-5 bg-[var(--color-surface)]/60 border-t border-[var(--color-border)] flex items-center justify-between px-3 text-[7px] font-mono text-[var(--color-text-dim)] shrink-0">
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
    <div className="w-full h-full bg-[var(--color-surface)]/50 flex flex-col relative overflow-hidden">
      <MockTopBar worktable="Main" />
      <div className="flex flex-1 overflow-hidden relative">
        <MockToolbar sections={quiltToolSections} />

        {/* Canvas */}
        <div className="flex-1 bg-[var(--color-bg)] relative flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(#E8DCCB 1px, transparent 1px)',
              backgroundSize: '20px 20px',
              opacity: 0.3,
            }}
          />

          <div className="relative bg-[var(--color-bg)] shadow-[0_1px_2px_rgba(26,26,26,0.08)] border border-[var(--color-border)] p-2 flex">
            <div className="grid grid-cols-3 gap-2 p-2" style={{ backgroundColor: `${COLORS.primary}1a`, border: `4px solid ${COLORS.primary}99` }}>
              {[...Array(9)].map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-16 bg-[var(--color-bg)] flex items-center justify-center border border-[var(--color-border)]/30 relative overflow-hidden"
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <polygon points="0,0 50,50 0,100" fill={COLORS.secondary} />
                    <polygon points="0,0 100,0 50,50" fill={COLORS.primary} />
                    <polygon points="100,0 100,100 50,50" fill={COLORS.accent} opacity="0.8" />
                    <polygon points="0,100 100,100 50,50" fill="white" />
                  </svg>
                  {i === 4 && <div className="absolute inset-0 z-10" style={{ border: `2px solid ${COLORS.primary}` }} />}
                </div>
              ))}
            </div>
          </div>

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
    <div className="w-full h-full bg-[var(--color-surface)]/50 flex flex-col relative overflow-hidden">
      <MockTopBar worktable="Block" />
      <div className="flex flex-1 overflow-hidden relative">
        <MockToolbar sections={blockToolSections} />

        <div className="flex-1 bg-[var(--color-bg)] relative flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(#E8DCCB 1px, transparent 1px)',
              backgroundSize: '10px 10px',
              opacity: 0.3,
            }}
          />

          <div className="relative w-64 h-64 bg-[var(--color-bg)] shadow-[0_1px_2px_rgba(26,26,26,0.08)] border border-[var(--color-border)]/30 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path
                d="M25 0 V100 M50 0 V100 M75 0 V100 M0 25 H100 M0 50 H100 M0 75 H100"
                stroke="#E8DCCB"
                strokeWidth="0.5"
                strokeDasharray="2 2"
                opacity="0.5"
              />
              <polygon points="50,0 100,50 50,100 0,50" fill={COLORS.secondary} opacity="0.4" />
              <polygon points="50,0 75,25 50,50 25,25" fill={COLORS.primary} opacity="0.8" />
              <polygon points="50,50 75,75 50,100 25,75" fill={COLORS.accent} opacity="0.8" />
              <line x1="25" y1="25" x2="10" y2="10" stroke={COLORS.primary} strokeWidth="1.5" />
              <circle cx="25" cy="25" r="2" fill="white" stroke={COLORS.primary} strokeWidth="1" />
              <circle cx="10" cy="10" r="2" fill={COLORS.accent} />
              <circle cx="50" cy="0" r="2" fill="white" stroke={COLORS.primary} strokeWidth="1" />
              <circle cx="50" cy="50" r="2" fill="white" stroke={COLORS.primary} strokeWidth="1" />
            </svg>
            <div className="absolute top-2 left-2 bg-[var(--color-text)] text-[var(--color-surface)] text-[8px] px-1.5 py-0.5 rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
              Snap to Grid (Intersect)
            </div>
          </div>

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
    <div className="w-full h-full bg-[var(--color-surface)]/50 flex flex-col relative overflow-hidden">
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

        <div className="flex-1 bg-[var(--color-surface)] relative flex items-center justify-center overflow-hidden">
          <div className="relative w-72 h-48 bg-[var(--color-bg)] shadow-[0_1px_2px_rgba(26,26,26,0.08)] overflow-hidden">
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
              style={{ boxShadow: '0 0 0 9999px rgba(44,36,32,0.6)' }}
            >
              <div
                className="w-full h-full border border-white/50"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '33.33% 33.33%',
                }}
              />
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-[var(--color-bg)] border border-[var(--color-border)]" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-[var(--color-bg)] border border-[var(--color-border)]" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-[var(--color-bg)] border border-[var(--color-border)]" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-[var(--color-bg)] border border-[var(--color-border)]" />
            </div>
          </div>

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
    <div className="w-full h-full bg-[var(--color-surface)]/50 flex flex-col relative overflow-hidden">
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

        <div className="flex-1 bg-[var(--color-surface)] relative flex items-center justify-center overflow-hidden p-6">
          <div className="bg-[var(--color-bg)] shadow-[0_1px_2px_rgba(26,26,26,0.08)] aspect-[8.5/11] h-full max-h-[300px] border border-[var(--color-border)] p-4 flex flex-col">
            <div
              className="text-[8px] font-bold text-[var(--color-text)] mb-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Quilt Pattern &mdash; True Scale 1:1
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="border border-dashed border-[var(--color-border)] p-1">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <polygon points="0,0 100,0 50,50" fill={COLORS.primary} />
                  <polygon points="0,0 50,50 0,100" fill={COLORS.secondary} />
                  <polygon points="100,0 100,100 50,50" fill={COLORS.accent} opacity="0.7" />
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
              <div className="border border-dashed border-[var(--color-border)] p-1">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect x="5" y="5" width="90" height="90" fill={COLORS.secondary} />
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
            <div className="mt-2 flex justify-between text-[6px] text-[var(--color-text-dim)]">
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
    caption: 'Choose from four layout modes &mdash; grid, sashing, on-point, or go completely free-form.',
    component: <QuiltWorktableMockup />,
  },
  {
    id: 'block',
    label: 'Block Worktable',
    shortLabel: 'Block',
    caption:
      'Draft your own blocks with EasyDraw &mdash; snap-to-grid seam lines make precision effortless.',
    component: <BlockWorktableMockup />,
  },
  {
    id: 'image',
    label: 'Image Worktable',
    shortLabel: 'Image',
    caption:
      'Upload your fabric photos and calibrate them to real-world scale &mdash; what you see is what you sew.',
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
    <section className="py-16 lg:py-24 bg-[var(--color-bg)] px-6 lg:px-12 text-center overflow-hidden relative">

      <div className="max-w-6xl mx-auto relative z-10">
        <div>
          <div className="flex items-center justify-center gap-4 mb-4">
            <Mascot pose="licking" size="md" />
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <QuiltPieceRow count={3} size={8} gap={4} />
              </div>
              <h2
                className="text-[32px] leading-[40px] md:text-[36px] md:leading-[44px] font-bold text-[var(--color-text)]"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Six Layout Presets. One Creative Flow.
              </h2>
            </div>
          </div>
          <p className="text-[18px] leading-[28px] text-[var(--color-text-dim)] mb-16 max-w-2xl mx-auto">
            Each layout preset handles a different stage of your quilting journey &mdash; from simple grids
            to sashing, on-point, strippy, medallion, and free-form arrangements.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          {/* Tab Controls */}
          <div className="flex flex-wrap items-center justify-center gap-2 pb-6">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`relative px-5 py-2.5 rounded-full text-sm font-bold transition-colors duration-150 ${activeTab === idx
                  ? 'text-[var(--color-text)] shadow-[0_1px_2px_rgba(26,26,26,0.08)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)]'
                  }`}
                style={activeTab === idx ? { backgroundColor: `${COLORS.primary}1a` } : undefined}
              >
                <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                <span className="relative z-10 sm:hidden">{tab.shortLabel}</span>
              </button>
            ))}
          </div>

          {/* Mockup Container */}
          <div className="relative">
            <div className="relative w-full aspect-square sm:aspect-[4/3] md:aspect-[16/9] overflow-hidden border border-[var(--color-border)] shadow-[0_1px_2px_rgba(26,26,26,0.08)] bg-[var(--color-surface)] rounded-lg">
              <div className="absolute inset-0 bg-[var(--color-surface)]/50">
                {tabs[activeTab].component}
              </div>
            </div>

            {/* Dynamic Caption */}
            <div className="mt-8">
              <p className="text-[18px] leading-[28px] font-medium text-[var(--color-text-dim)]">
                {tabs[activeTab].caption}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
