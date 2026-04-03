'use client';

import { useCanvasStore } from '@/stores/canvasStore';

interface PatternOverlayPanelProps {
  onClose: () => void;
}

export function PatternOverlayPanel({ onClose }: PatternOverlayPanelProps) {
  const showPatternOverlay = useCanvasStore((s) => s.showPatternOverlay);
  const autoAlignToPattern = useCanvasStore((s) => s.autoAlignToPattern);
  const setShowPatternOverlay = useCanvasStore((s) => s.setShowPatternOverlay);
  const setAutoAlignToPattern = useCanvasStore((s) => s.setAutoAlignToPattern);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-md rounded-xl bg-surface shadow-elevation-3 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface">Pattern Overlay</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5L15 15M5 15L15 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          {/* Show Pattern Overlay Toggle */}
          <div className="flex items-start justify-between p-3 bg-surface-container rounded-md">
            <div className="flex-1 mr-3">
              <div className="text-body-md text-on-surface font-medium mb-1">
                Show Pattern Overlay
              </div>
              <div className="text-body-sm text-secondary">
                Display layout cell boundaries on the worktable
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={showPatternOverlay}
              onClick={() => setShowPatternOverlay(!showPatternOverlay)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                showPatternOverlay ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
                  showPatternOverlay ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Auto Align Toggle */}
          <div className="flex items-start justify-between p-3 bg-surface-container rounded-md">
            <div className="flex-1 mr-3">
              <div className="text-body-md text-on-surface font-medium mb-1">
                Auto Align Blocks to Cells
              </div>
              <div className="text-body-sm text-secondary">
                Snap dropped blocks to nearest layout cell center
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoAlignToPattern}
              onClick={() => setAutoAlignToPattern(!autoAlignToPattern)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                autoAlignToPattern ? 'bg-primary' : 'bg-outline-variant'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow transition-transform ${
                  autoAlignToPattern ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
