'use client';

import { useState, useMemo } from 'react';
import {
  BLOCK_OVERLAYS,
  LAYOUT_OVERLAYS,
  type BlockOverlay,
  type LayoutOverlay,
} from '@/lib/quilt-overlay-registry';

interface RecommendedDimensionsModalProps {
  onSelect: (width: number, height: number) => void;
  onClose: () => void;
  selectedOverlay?: string | null;
  selectedType?: 'block' | 'layout' | null;
}

/**
 * Find the closest even block size that produces uniform pieces
 */
function findEvenBlockSizes(
  width: number,
  height: number,
  blockType: 'block' | 'layout'
): {
  blockSize: number;
  cols: number;
  rows: number;
  total: number;
  actualWidth: number;
  actualHeight: number;
}[] {
  const results: Array<{
    blockSize: number;
    cols: number;
    rows: number;
    total: number;
    actualWidth: number;
    actualHeight: number;
  }> = [];

  // For block overlays, target common finished sizes
  // For pattern overlays, calculate based on pattern dimensions
  const targetSizes = [6, 8, 9, 10, 12, 14, 16, 18, 20, 24, 30, 36];

  for (const blockSize of targetSizes) {
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);
    const total = cols * rows;
    const actualWidth = cols * blockSize;
    const actualHeight = rows * blockSize;

    // Only include if it's within 20% of target
    const widthRatio = actualWidth / width;
    const heightRatio = actualHeight / height;
    if (widthRatio <= 1.2 && heightRatio <= 1.2) {
      results.push({ blockSize, cols, rows, total, actualWidth, actualHeight });
    }
  }

  return results.sort((a, b) => a.total - b.total);
}

/**
 * Calculate recommended dimensions that produce even block pieces
 */
function calculateRecommendations(pattern: LayoutOverlay): Array<{
  label: string;
  width: number;
  height: number;
  blockSize: number;
  cols: number;
  rows: number;
  total: number;
  isClosest: boolean;
}> {
  const recommendations: Array<{
    label: string;
    width: number;
    height: number;
    blockSize: number;
    cols: number;
    rows: number;
    total: number;
    isClosest: boolean;
  }> = [];
  const aspectRatio = pattern.dimensions.width / pattern.dimensions.height;

  // Common block sizes
  const blockSizes = [6, 8, 9, 10, 12, 14, 16, 18, 20, 24];

  for (const bs of blockSizes) {
    const cols = Math.ceil(pattern.dimensions.width / bs);
    const rows = Math.ceil(pattern.dimensions.height / bs);
    const width = cols * bs;

    // Maintain aspect ratio - adjust height to match width's aspect
    const adjustedHeight = Math.round(width / aspectRatio);
    const adjustedRows = Math.ceil(adjustedHeight / bs);
    const finalHeight = adjustedRows * bs;
    const finalTotal = cols * adjustedRows;

    if (finalTotal <= 200 && finalTotal >= 4) {
      recommendations.push({
        label: `${bs}" blocks`,
        width,
        height: finalHeight,
        blockSize: bs,
        cols,
        rows: adjustedRows,
        total: finalTotal,
        isClosest: bs === 12,
      });
    }
  }

  return recommendations;
}

export function RecommendedDimensionsModal({
  onSelect,
  onClose,
  selectedOverlay,
}: RecommendedDimensionsModalProps) {
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [lockAspect, setLockAspect] = useState(true);

  const selectedBlock = useMemo(
    () => BLOCK_OVERLAYS.find((b) => b.svgPath === selectedOverlay),
    [selectedOverlay]
  );
  const selectedPattern = useMemo(
    () => LAYOUT_OVERLAYS.find((p) => p.svgPath === selectedOverlay),
    [selectedOverlay]
  );

  const recommendations = useMemo(() => {
    if (selectedPattern) {
      return calculateRecommendations(selectedPattern);
    }
    if (selectedBlock) {
      return findEvenBlockSizes(100, 100, 'block').map((r) => ({
        label: `${r.blockSize}" blocks`,
        width: r.actualWidth,
        height: r.actualHeight,
        blockSize: r.blockSize,
        cols: r.cols,
        rows: r.rows,
        total: r.total,
        isClosest: r.blockSize === 12,
      }));
    }
    return [];
  }, [selectedBlock, selectedPattern]);

  const handleCustomApply = () => {
    const w = parseInt(customWidth, 10);
    const h = parseInt(customHeight, 10);
    if (w > 0 && h > 0 && w <= 200 && h <= 200) {
      onSelect(w, h);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/50">
      <div className="w-[600px] max-h-[80vh] rounded-xl bg-surface p-5 shadow-elevation-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-on-surface">Recommended Dimensions</h2>
            <p className="text-xs text-secondary mt-0.5">
              Even block sizes that maintain the pattern&apos;s aspect ratio
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-secondary hover:text-on-surface">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Pattern info */}
        {selectedPattern && (
          <div className="mb-3 rounded-lg bg-background p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-on-surface">
                {selectedPattern.displayName}
              </span>
              <span className="text-xs text-secondary">
                Original: {selectedPattern.dimensions.width}&quot; &times;{' '}
                {selectedPattern.dimensions.height}&quot;
              </span>
            </div>
            {selectedPattern.blockLayout && (
              <span className="text-[11px] text-secondary">
                Layout: {selectedPattern.blockLayout.cols} × {selectedPattern.blockLayout.rows}{' '}
                blocks
              </span>
            )}
          </div>
        )}

        {/* Recommendations grid */}
        <div className="flex-1 overflow-y-auto mb-4">
          <div className="grid grid-cols-2 gap-2">
            {recommendations.map((rec) => (
              <button
                key={rec.label}
                type="button"
                onClick={() => onSelect(rec.width, rec.height)}
                className={`rounded-lg border p-3 text-left transition-all hover:shadow-elevation-2 ${rec.isClosest
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                  : 'border-outline-variant bg-white hover:border-primary/50'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">{rec.label}</span>
                </div>
                <div className="mt-1 text-xs text-secondary">
                  {rec.width}&quot; &times; {rec.height}&quot;
                </div>
                <div className="mt-0.5 text-[11px] text-secondary">
                  {rec.cols} × {rec.rows} = {rec.total} blocks
                </div>
                <div className="mt-0.5 text-[10px] text-secondary">
                  Each block: {rec.blockSize}&quot; &times; {rec.blockSize}&quot;
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom dimensions */}
        <div className="border-t border-outline-variant pt-3">
          <h3 className="text-sm font-medium text-on-surface mb-2">Custom Dimensions</h3>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[11px] text-secondary mb-0.5">Width (inches)</label>
              <input
                type="number"
                value={customWidth}
                onChange={(e) => {
                  setCustomWidth(e.target.value);
                  if (lockAspect && selectedPattern) {
                    const w = parseInt(e.target.value, 10);
                    if (w > 0) {
                      const aspectRatio =
                        selectedPattern.dimensions.width / selectedPattern.dimensions.height;
                      setCustomHeight(String(Math.round(w / aspectRatio)));
                    }
                  }
                }}
                placeholder="72"
                min="6"
                max="200"
                className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-end pb-1.5">
              <button
                type="button"
                onClick={() => setLockAspect(!lockAspect)}
                className={`rounded p-1.5 transition-colors ${lockAspect ? 'bg-primary/10 text-primary' : 'bg-background text-secondary'
                  }`}
                title={lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {lockAspect ? (
                    <>
                      <rect
                        x="5"
                        y="7"
                        width="6"
                        height="5"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                      <path
                        d="M6 7V5a2 2 0 014 0v2"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </>
                  ) : (
                    <>
                      <rect
                        x="5"
                        y="7"
                        width="6"
                        height="5"
                        rx="1"
                        stroke="currentColor"
                        strokeWidth="1.2"
                      />
                      <path
                        d="M6 7V5a2 2 0 013.7-.8"
                        stroke="currentColor"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                    </>
                  )}
                </svg>
              </button>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] text-secondary mb-0.5">Height (inches)</label>
              <input
                type="number"
                value={customHeight}
                onChange={(e) => {
                  setCustomHeight(e.target.value);
                  if (lockAspect && selectedPattern) {
                    const h = parseInt(e.target.value, 10);
                    if (h > 0) {
                      const aspectRatio =
                        selectedPattern.dimensions.width / selectedPattern.dimensions.height;
                      setCustomWidth(String(Math.round(h * aspectRatio)));
                    }
                  }
                }}
                placeholder="88"
                min="6"
                max="200"
                className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleCustomApply}
                disabled={!customWidth || !customHeight}
                className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
