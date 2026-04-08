'use client';

import { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useAuthStore } from '@/stores/authStore';
import { ON_SURFACE_COLOR } from '@/lib/constants';

import { HamburgerDrawer } from '@/components/studio/HamburgerDrawer';
import { TooltipHint } from '@/components/ui/TooltipHint';
import { useToast } from '@/components/ui/ToastProvider';
import { ProUpgradeModal } from '@/components/billing/ProUpgradeModal';
import { QuiltSettingsDropdown } from '@/components/studio/QuiltSettingsDropdown';
import { Sparkles } from 'lucide-react';

function formatTimestamp(date: Date | null): string {
  if (!date) return '';
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

function ReferenceImageToggle() {
  const referenceImageUrl = useCanvasStore((s) => s.referenceImageUrl);
  const showReferencePanel = useCanvasStore((s) => s.showReferencePanel);
  const toggleReferencePanel = useCanvasStore((s) => s.toggleReferencePanel);

  if (!referenceImageUrl) return null;

  return (
    <TooltipHint
      name={showReferencePanel ? 'Hide Reference Photo' : 'Show Reference Photo'}
      description="Side-by-side view of the original photo used in Photo to Design"
    >
      <button
        type="button"
        onClick={toggleReferencePanel}
        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${showReferencePanel
          ? 'bg-primary/12 text-primary ring-1 ring-primary/20'
          : 'text-on-surface/50 hover:text-on-surface hover:bg-surface-container'
          }`}
        aria-label={showReferencePanel ? 'Hide reference photo' : 'Show reference photo'}
        aria-pressed={showReferencePanel}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <rect
            x="1"
            y="3"
            width="8"
            height="14"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <rect
            x="11"
            y="3"
            width="8"
            height="14"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <circle cx="15" cy="8" r="1.5" stroke="currentColor" strokeWidth="1" />
          <path
            d="M11 14L13 11L15 13L17 10L19 12"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </TooltipHint>
  );
}

function ToolsMenu({
  onOpenHistory,
  onOpenHelp,
}: {
  onOpenHistory?: () => void;
  onOpenHelp?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const items = [
    {
      label: 'History',
      description: 'View and restore previous states',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path
            d="M4 10C4 6.7 6.7 4 10 4C13.3 4 16 6.7 16 10C16 13.3 13.3 16 10 16C7.8 16 5.9 14.8 5 13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path d="M10 7V10L12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M5 13L3 11L5 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      action: () => {
        onOpenHistory?.();
        setOpen(false);
      },
    },
    {
      label: 'Help & Shortcuts',
      description: 'Keyboard shortcuts and tutorials',
      icon: (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 7.5C8 6.5 8.8 5.5 10 5.5C11.2 5.5 12 6.5 12 7.5C12 8.5 11 9 10 9.5V10.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="10" cy="13" r="0.75" fill="currentColor" />
        </svg>
      ),
      action: () => {
        onOpenHelp?.();
        setOpen(false);
      },
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium text-on-surface/70 hover:text-on-surface hover:bg-surface-container transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="11" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="3" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
          <rect x="11" y="11" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        Tools
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-outline-variant/20 rounded-xl shadow-elevation-2 py-1.5 z-50">
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-surface-container-high transition-colors text-left"
            >
              <span className="text-on-surface/50 flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <div className="text-[13px] font-medium text-on-surface">{item.label}</div>
                <div className="text-[11px] text-on-surface/50">{item.description}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface StudioTopBarProps {
  readonly onOpenImageExport?: () => void;
  readonly onOpenPdfExport?: () => void;
  readonly onOpenHelp?: () => void;
  readonly onSave?: () => void;
  readonly onOpenHistory?: () => void;
}

export function StudioTopBar({
  onOpenImageExport,
  onOpenPdfExport,
  onOpenHelp,
  onSave,
  onOpenHistory,
}: StudioTopBarProps) {
  const projectName = useProjectStore((s) => s.projectName);
  const isDirty = useProjectStore((s) => s.isDirty);
  const lastSavedAt = useProjectStore((s) => s.lastSavedAt);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showProUpgrade, setShowProUpgrade] = useState(false);
  const isViewportLocked = useCanvasStore((s) => s.isViewportLocked);
  const user = useAuthStore((s) => s.user);
  const isPro = user?.role === 'pro' || user?.role === 'admin';
  const { toast } = useToast();

  useEffect(() => {
    function handleSaveSuccess() {
      toast({
        type: 'success',
        title: 'Saved',
        description: 'Your project has been saved',
      });
    }
    window.addEventListener('quiltcorgi:save-success', handleSaveSuccess);
    return () => window.removeEventListener('quiltcorgi:save-success', handleSaveSuccess);
  }, [toast]);

  return (
    <>
      <div className="h-12 bg-surface border-b border-outline-variant/15 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <TooltipHint
            name="Menu"
            description="Access project settings and options"
            mascot="/mascots&avatars/corgi5.png"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen((prev) => !prev)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-on-surface/50 hover:text-on-surface hover:bg-surface-container transition-colors"
              aria-label="Open menu"
            >
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path
                  d="M3 5H17M3 10H17M3 15H17"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </TooltipHint>
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="QuiltCorgi Logo" className="h-6 w-auto" />
            <span className="font-semibold text-[15px] text-on-surface tracking-[-0.01em]">
              QuiltCorgi
            </span>
          </div>
        </div>

        {/* Center: empty spacer (mode tabs moved to WorktableTabs) */}
        <div className="absolute left-1/2 -translate-x-1/2" />

        {/* Right: Viewport controls + Project info + Export + Upgrade */}
        <div className="flex items-center gap-4">
          {!isPro && (
            <button
              onClick={() => setShowProUpgrade(true)}
              className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-primary to-primary-dark px-3 py-1.5 text-xs font-extrabold text-white shadow-elevation-1 hover:shadow-elevation-2 transition-all hover:scale-105"
            >
              <Sparkles size={14} className="text-white" />
              Upgrade to Pro
            </button>
          )}

          {/* Viewport lock/unlock + recenter */}
          <div className="flex items-center gap-1">
            <TooltipHint
              name={isViewportLocked ? 'Viewport Locked' : 'Viewport Unlocked'}
              description={
                isViewportLocked
                  ? 'Click to unlock and pan/zoom freely'
                  : 'Click to lock viewport to centered fit'
              }
              mascot="/mascots&avatars/corgi29.png"
            >
              <button
                type="button"
                onClick={() => useCanvasStore.getState().setViewportLocked(!isViewportLocked)}
                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${isViewportLocked
                  ? 'hover:bg-surface-container'
                  : 'bg-primary/10 hover:bg-primary/20'
                  }`}
                aria-label={isViewportLocked ? 'Unlock viewport' : 'Lock viewport'}
              >
                {isViewportLocked ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke={ON_SURFACE_COLOR}
                    strokeWidth="1.4"
                  >
                    <rect x="4" y="9" width="12" height="8" rx="2" />
                    <path
                      d="M7 9V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V9"
                      strokeLinecap="round"
                    />
                  </svg>
                ) : (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke={ON_SURFACE_COLOR}
                    strokeWidth="1.4"
                  >
                    <rect x="4" y="9" width="12" height="8" rx="2" />
                    <path
                      d="M7 9V6C7 4.34 8.34 3 10 3C11.66 3 13 4.34 13 6V7"
                      strokeLinecap="round"
                    />
                  </svg>
                )}
              </button>
            </TooltipHint>

            {/* Quick recenter — only visible when unlocked */}
            {!isViewportLocked && (
              <TooltipHint
                name="Recenter Viewport"
                description="Snap grid back to center of canvas"
                mascot="/mascots&avatars/corgi1.png"
              >
                <button
                  type="button"
                  onClick={() => useCanvasStore.getState().centerAndFitViewport()}
                  className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container transition-colors"
                  aria-label="Recenter viewport"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke={ON_SURFACE_COLOR}
                    strokeWidth="1.4"
                  >
                    <circle cx="10" cy="10" r="3" />
                    <path d="M10 3V7M10 13V17M3 10H7M13 10H17" strokeLinecap="round" />
                  </svg>
                </button>
              </TooltipHint>
            )}
          </div>

          <ReferenceImageToggle />

          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <div className="text-[13px] font-medium text-on-surface truncate max-w-48">
                {projectName}
              </div>
              {isDirty && (
                <div className="w-1.5 h-1.5 rounded-full bg-warning" title="Unsaved changes" />
              )}
            </div>
            <div className="text-[11px] text-on-surface/45">
              {lastSavedAt ? `Saved ${formatTimestamp(lastSavedAt)}` : 'Quilt Canvas'}
            </div>
          </div>

          <div className="h-6 w-px bg-outline-variant/30" />

          <div className="flex items-center gap-1">
            <QuiltSettingsDropdown />
            <ToolsMenu onOpenHistory={onOpenHistory} onOpenHelp={onOpenHelp} />
          </div>

          <TooltipHint
            name="Export"
            description="Export your quilt as PNG, SVG, or PDF"
            mascot="/mascots&avatars/corgi23.png"
          >
            <button
              type="button"
              onClick={() => {
                if (!isPro) {
                  setShowProUpgrade(true);
                  return;
                }
                onOpenImageExport?.();
              }}
              className="bg-on-surface text-surface rounded-lg px-4 py-1.5 text-[13px] font-semibold tracking-wide hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              Export
              {!isPro && <Sparkles size={12} className="text-primary" />}
            </button>
          </TooltipHint>
        </div>
      </div>

      <HamburgerDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSave={onSave}
        onOpenImageExport={onOpenImageExport}
        onOpenPdfExport={onOpenPdfExport}
        onOpenHelp={onOpenHelp}
      />

      {showProUpgrade && <ProUpgradeModal onClose={() => setShowProUpgrade(false)} />}
    </>
  );
}
