'use client';

import Link from 'next/link';
import {
  MousePointer,
  PenTool,
  Hexagon,
  Pencil,
  Spline,
  Undo2,
  Redo2,
  ImageIcon,
  Menu,
  ChevronLeft,
  Grid3X3,
  ZoomOut,
  ZoomIn,
  Lock,
} from 'lucide-react';
import ScrollReveal from './ScrollReveal';

/* ── Inline UI mockup of the Design Studio ─────────────────────────────── */
function StudioMockup() {
  const toolbarGroups = [
    {
      items: [
        { label: 'Select', icon: <MousePointer size={20} />, active: true },
        { label: 'Pen', icon: <PenTool size={20} />, active: false },
        { label: 'Polygon', icon: <Hexagon size={20} />, active: false },
        { label: 'Easy Draw', icon: <Pencil size={20} />, active: false },
        { label: 'Bend', icon: <Spline size={20} />, active: false },
      ],
    },
    {
      items: [
        { label: 'Undo', icon: <Undo2 size={20} />, active: false },
        { label: 'Redo', icon: <Redo2 size={20} />, active: false },
      ],
    },
    {
      items: [
        { label: 'Export', icon: <ImageIcon size={20} />, active: false },
      ],
    },
  ];

  const blocks = ['Four Patch', 'Nine Patch', 'Half Square', 'Flying Geese', 'Log Cabin', 'Ohio Star'];

  function BlockPattern({ name, size = 40, outline = false }: { name: string; size?: string | number; outline?: boolean }) {
    const uid = Math.random().toString(36).slice(2, 9);
    const primary = '/fabrics/10227-E.jpg';
    const secondary = '/fabrics/10429-Y.jpg';
    const bg = '/fabrics/10227-L1.jpg';
    const dark = '/fabrics/10227-E4.jpg';

    const pat = (id: string, src: string) => (
      <pattern id={`${id}-${uid}`} patternUnits="userSpaceOnUse" width="40" height="40">
        <image href={src} width="40" height="40" preserveAspectRatio="xMidYMid slice" />
      </pattern>
    );

    const olFill = 'var(--color-secondary)';
    const olFillOp = '0.15';
    const olStroke = 'var(--color-text)';
    const olStrokeW = '0.8';
    const olJoin = 'round' as const;

    switch (name) {
      case 'Four Patch':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <defs>
              {pat('fp-p', primary)}
              {pat('fp-s', secondary)}
            </defs>
            <rect x="0" y="0" width="20" height="20" fill={outline ? olFill : `url(#fp-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="20" y="0" width="20" height="20" fill={outline ? olFill : `url(#fp-s-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="0" y="20" width="20" height="20" fill={outline ? olFill : `url(#fp-s-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="20" y="20" width="20" height="20" fill={outline ? olFill : `url(#fp-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
          </svg>
        );
      case 'Nine Patch':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <defs>
              {pat('np-p', primary)}
              {pat('np-s', secondary)}
            </defs>
            {[
              ['np-p', 'np-s', 'np-p'],
              ['np-s', 'np-p', 'np-s'],
              ['np-p', 'np-s', 'np-p'],
            ].flatMap((row, ri) =>
              row.map((pid, ci) => (
                <rect key={`${ri}-${ci}`} x={ci * 13.33} y={ri * 13.33} width="13.34" height="13.34" fill={outline ? olFill : `url(#${pid}-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
              )),
            )}
          </svg>
        );
      case 'Half Square':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <defs>
              {pat('hs-p', primary)}
              {pat('hs-s', secondary)}
            </defs>
            <polygon points="0,0 40,0 0,40" fill={outline ? olFill : `url(#hs-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="40,0 40,40 0,40" fill={outline ? olFill : `url(#hs-s-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
          </svg>
        );
      case 'Flying Geese':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <defs>
              {pat('fg-bg', bg)}
              {pat('fg-p', primary)}
            </defs>
            <polygon points="0,0 40,0 40,20" fill={outline ? olFill : `url(#fg-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="0,40 40,40 40,20" fill={outline ? olFill : `url(#fg-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="0,0 40,20 0,40" fill={outline ? olFill : `url(#fg-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
          </svg>
        );
      case 'Log Cabin':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <defs>
              {pat('lc-p', primary)}
              {pat('lc-light', bg)}
              {pat('lc-dark', dark)}
            </defs>
            <rect x="16" y="16" width="8" height="8" fill={outline ? olFill : `url(#lc-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="16" y="8" width="8" height="8" fill={outline ? olFill : `url(#lc-light-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="24" y="8" width="8" height="16" fill={outline ? olFill : `url(#lc-light-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="8" y="24" width="24" height="8" fill={outline ? olFill : `url(#lc-dark-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="8" y="8" width="8" height="24" fill={outline ? olFill : `url(#lc-dark-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="8" y="0" width="24" height="8" fill={outline ? olFill : `url(#lc-light-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="32" y="0" width="8" height="32" fill={outline ? olFill : `url(#lc-light-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="0" y="32" width="32" height="8" fill={outline ? olFill : `url(#lc-dark-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="0" y="0" width="8" height="32" fill={outline ? olFill : `url(#lc-dark-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
          </svg>
        );
      case 'Ohio Star':
        return (
          <svg width={size} height={size} viewBox="0 0 40 40">
            <defs>
              {pat('os-p', primary)}
              {pat('os-bg', bg)}
            </defs>
            <rect x="13.33" y="13.33" width="13.34" height="13.34" fill={outline ? olFill : `url(#os-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="13.33" y="0" width="13.34" height="13.33" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="26.67" y="13.33" width="13.33" height="13.34" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="13.33" y="26.67" width="13.34" height="13.33" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <rect x="0" y="13.33" width="13.33" height="13.34" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="6.67,6.67 0,0 13.33,0" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="6.67,6.67 13.33,0 13.33,13.33" fill={outline ? olFill : `url(#os-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="6.67,6.67 13.33,13.33 0,13.33" fill={outline ? olFill : `url(#os-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="6.67,6.67 0,13.33 0,0" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="33.33,6.67 26.67,0 40,0" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="33.33,6.67 40,0 40,13.33" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="33.33,6.67 40,13.33 26.67,13.33" fill={outline ? olFill : `url(#os-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="33.33,6.67 26.67,13.33 26.67,0" fill={outline ? olFill : `url(#os-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="6.67,33.33 0,26.67 13.33,26.67" fill={outline ? olFill : `url(#os-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="6.67,33.33 13.33,26.67 13.33,40" fill={outline ? olFill : `url(#os-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="6.67,33.33 13.33,40 0,40" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="6.67,33.33 0,40 0,26.67" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="33.33,33.33 26.67,26.67 40,26.67" fill={outline ? olFill : `url(#os-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="33.33,33.33 40,26.67 40,40" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="33.33,33.33 40,40 26.67,40" fill={outline ? olFill : `url(#os-bg-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
            <polygon points="33.33,33.33 26.67,40 26.67,26.67" fill={outline ? olFill : `url(#os-p-${uid})`} fillOpacity={outline ? olFillOp : undefined} stroke={outline ? olStroke : undefined} strokeWidth={outline ? olStrokeW : undefined} strokeLinejoin={outline ? olJoin : undefined} />
          </svg>
        );
      default:
        return <div style={{ width: size, height: size, backgroundColor: 'var(--color-primary)', opacity: 0.35 }} />;
    }
  }

  return (
    <div className="rounded-lg overflow-hidden shadow-elevated border border-[var(--color-border)] bg-[var(--color-bg)] flex flex-col">
      {/* ── Top bar ── */}
      <div className="h-12 bg-[var(--color-bg)] border-b border-[var(--color-border)]/15 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)]/50">
            <Menu size={18} />
          </div>
          <div className="flex items-center gap-1.5 text-[14px] text-[var(--color-text)]/70">
            <ChevronLeft size={14} />
            <span>Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-2 h-2 rounded-full bg-primary/80 flex-shrink-0" />
            <span className="font-semibold text-[15px] text-[var(--color-text)] tracking-[-0.01em]">Summer Garden</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--color-secondary)]/20 text-[var(--color-text)] border border-[var(--color-border)]">Layout</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[12px] font-medium text-[var(--color-text)]/80 border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors duration-150 cursor-default">Edit</span>
          <span className="px-3 py-1 rounded-full text-[12px] font-medium text-[var(--color-text)]/50 cursor-default">Preview</span>
        </div>
      </div>

      {/* ── Worktable tabs ── */}
      <div className="flex h-9 flex-shrink-0 items-end gap-0 border-b border-[var(--color-border)]/15 bg-[var(--color-bg)] px-3">
        <div className="px-4 py-1.5 text-[13px] leading-[20px] font-semibold rounded-t-lg border-b-2 border-[var(--color-primary)] text-[var(--color-text)] bg-[var(--color-border)]/20">
          Quilt
        </div>
        <div className="px-4 py-1.5 text-[13px] leading-[20px] font-semibold rounded-t-lg text-[var(--color-text)]/60 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/10 transition-colors duration-150">
          Block Builder
        </div>
      </div>

      {/* ── Main work area ── */}
      <div className="flex min-h-[340px] md:min-h-[420px]">
        {/* Left toolbar */}
        <div className="w-[88px] bg-[var(--color-bg)] border-r border-[var(--color-border)]/15 flex flex-col py-2 overflow-hidden flex-shrink-0">
          <div className="flex flex-col items-center gap-0.5 px-1">
            {toolbarGroups.map((group, gi) => (
              <div key={gi} className="w-full">
                {gi > 0 && <div className="w-10 h-px bg-[var(--color-border)]/40 mx-auto my-1" />}
                <div className="flex flex-col items-center gap-0.5 py-0.5">
                  {group.items.map((tool) => (
                    <div
                      key={tool.label}
                      className={`w-[72px] flex flex-col items-center justify-center gap-1 py-2 transition-colors duration-150 ${
                        tool.active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
                      }`}
                    >
                      <span className="[&>svg]:w-5 [&>svg]:h-5">{tool.icon}</span>
                      <span className="text-[14px] leading-[20px] text-center truncate w-full px-1">{tool.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 relative overflow-hidden bg-[var(--color-bg)]">
          {/* Grid background */}
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          {/* Quilt layout with blocks, sashing and borders */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full max-w-[260px] md:max-w-[320px] aspect-[3/4] shadow-sm">
              {/* Outer border */}
              <div className="absolute inset-0 bg-[var(--color-secondary)]/10 rounded-sm border border-[var(--color-border)]" />
              {/* Inner quilt area (inside border) */}
              <div className="absolute inset-[8%] bg-[var(--color-surface)] rounded-sm border border-[var(--color-border)]">
                {/* 3×4 grid — dashed outlines everywhere, 2 fabric blocks on top corners */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-2">
                  {/* Row 1 */}
                  <div className="relative overflow-hidden rounded-[2px]">
                    <BlockPattern name="Four Patch" size="100%" />
                  </div>
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                  <div className="relative overflow-hidden rounded-[2px]">
                    <BlockPattern name="Ohio Star" size="100%" />
                  </div>
                  {/* Row 2 */}
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                  {/* Row 3 */}
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                  {/* Row 4 */}
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                  <div className="border-2 border-dashed border-[var(--color-border)]/40 rounded-[2px]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right panel — Blocks / Fabrics */}
        <div className="hidden md:flex w-[280px] lg:w-[320px] bg-[var(--color-bg)] border-l border-[var(--color-border)]/15 flex-col flex-shrink-0 overflow-hidden">
          <div className="flex border-b border-[var(--color-border)]/40 flex-shrink-0">
            <div className="flex-1 py-2.5 text-[14px] leading-[20px] font-semibold text-center border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]">
              Blocks
            </div>
            <div className="flex-1 py-2.5 text-[14px] leading-[20px] font-semibold text-center text-[var(--color-text)]/60 hover:text-[var(--color-text)] transition-colors">
              Fabrics
            </div>
          </div>
          <div className="flex-1 p-3 space-y-2 overflow-hidden">
            {blocks.map((name) => (
              <div key={name} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[var(--color-surface)] transition-colors duration-150 cursor-default">
                <div className="w-10 h-10 rounded-sm border border-[var(--color-border)] shrink-0 overflow-hidden">
                  <BlockPattern name={name} size="100%" outline />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-[var(--color-text)] block truncate">{name}</span>
                  <span className="text-[11px] text-[var(--color-text-dim)]">Block</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="h-10 bg-[var(--color-bg)] border-t border-[var(--color-border)] flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-1">
          <div className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors duration-150">
            <ZoomOut size={16} />
          </div>
          <div className="w-12 h-6 flex items-center justify-center text-[12px] text-[var(--color-text)]">100%</div>
          <div className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors duration-150">
            <ZoomIn size={16} />
          </div>
          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
          <div className="w-7 h-7 flex items-center justify-center rounded-full text-primary bg-primary/10 transition-colors duration-150">
            <Grid3X3 size={16} />
          </div>
          <span className="text-[11px] text-[var(--color-text-dim)] ml-2 tabular-nums">Snap: cells</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[11px] text-[var(--color-text-dim)] mr-2 tabular-nums">60 × 60 in · 4×4 grid · 12″ blocks</span>
          <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
          <div className="w-7 h-7 flex items-center justify-center rounded-full text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors duration-150">
            <Lock size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DesignStudioMoment() {
  return (
    <section className="relative py-24 md:py-36 px-6 md:px-12 lg:px-20" style={{ background: 'linear-gradient(160deg, #C5DFF3 0%, #FEFDFB 50%)' }}>
      <ScrollReveal>
        <div className="max-w-7xl mx-auto mb-14 md:mb-16">
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight max-w-3xl">
            Two worktables. One canvas.{' '}
            <span className="text-[var(--color-text-dim)] font-light">Design on screen before you cut.</span>
          </h2>
        </div>
      </ScrollReveal>

      {/* Desktop: inline studio mockup */}
      <div className="hidden md:block">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto">
            <StudioMockup />

            {/* Feature pills */}
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              {[
                'Drag-and-drop blocks',
                'Worktable + Block Builder',
                'Resize & rotate',
                'On-point layouts',
                'Export to PDF',
              ].map((label) => (
                <span
                  key={label}
                  className="px-4 py-2 rounded-full text-sm font-medium bg-[var(--color-secondary)]/20 text-[var(--color-text)] border border-[var(--color-border)]"
                >
                  {label}
                </span>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/design-studio" className="btn-primary px-8 py-3 text-base">
                Open the Studio
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* Mobile: text-only */}
      <div className="md:hidden">
        <ScrollReveal>
          <div className="text-center px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-secondary)]/30 mb-8">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
              </svg>
            </div>
            <h2 className="font-heading text-3xl font-extrabold leading-tight mb-4">
              Plan on <span className="text-[var(--color-primary)]">desktop</span>,<br />quilt anywhere.
            </h2>
            <p className="text-[var(--color-text-dim)] max-w-xs mx-auto mb-6">
              The Design Studio loves a big screen. Open it on your computer for the full workspace — your patterns travel with you.
            </p>
            <Link href="/design-studio" className="btn-primary px-6 py-3">
              Open Studio
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
