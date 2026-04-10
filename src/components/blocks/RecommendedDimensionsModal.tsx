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

  const targetSizes = [6, 8, 9, 10, 12, 14, 16, 18, 20, 24, 30, 36];

  for (const blockSize of targetSizes) {
    const cols = Math.ceil(width / blockSize);
    const rows = Math.ceil(height / blockSize);
    const total = cols * rows;
    const actualWidth = cols * blockSize;
    const actualHeight = rows * blockSize;

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

  const blockSizes = [6, 8, 9, 10, 12, 14, 16, 18, 20, 24];

  for (const bs of blockSizes) {
    const cols = Math.ceil(pattern.dimensions.width / bs);
    const rows = Math.ceil(pattern.dimensions.height / bs);
    const width = cols * bs;

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
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#2d2a26]/60">
      <div className="flex w-[600px] max-h-[85vh] flex-col rounded-lg bg-[#ffffff] border border-[#e8e1da] shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e1da] p-4">
          <div>
            <h2 className="text-[24px] leading-[32px] text-[#2d2a26]">Recommended Dimensions</h2>
            <p className="text-[14px] leading-[20px] text-[#6b655e] mt-1">
              Maintains exact aspect ratio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#ff8d49]/10 transition-colors duration-150"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 5l10 10M15 5L5 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-hidden">
          {/* Pattern info */}
          {selectedPattern && (
            <div className="border border-[#e8e1da] bg-[#fdfaf7] p-4 flex flex-col gap-2 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-[16px] leading-[24px] text-[#2d2a26]">
                  {selectedPattern.displayName}
                </span>
                <span className="text-[14px] leading-[20px] text-[#6b655e]">
                  Original: {selectedPattern.dimensions.width}&quot; &times; {selectedPattern.dimensions.height}&quot;
                </span>
              </div>
              {selectedPattern.blockLayout && (
                <span className="text-[14px] leading-[20px] text-[#6b655e]">
                  Layout: {selectedPattern.blockLayout.cols} &times; {selectedPattern.blockLayout.rows} blocks
                </span>
              )}
            </div>
          )}

          {/* Recommendations grid */}
          <div className="flex-1 overflow-y-auto pr-2 pb-2 min-h-0">
            <div className="grid grid-cols-2 gap-4">
              {recommendations.map((rec) => (
                <button
                  key={rec.label}
                  type="button"
                  onClick={() => onSelect(rec.width, rec.height)}
                  className={`group flex flex-col items-start border rounded-lg p-4 text-left transition-colors duration-150 ${rec.isClosest
                    ? 'border-[#ff8d49] bg-[#ff8d49]/5'
                    : 'border-[#e8e1da] bg-[#ffffff] hover:border-[#ff8d49]/50'
                    }`}
                >
                  <span className="text-[16px] leading-[24px] text-[#2d2a26]">
                    {rec.label}
                  </span>
                  <div className="mt-2 text-[16px] leading-[24px] text-[#2d2a26]">
                    {rec.width}&quot; &times; {rec.height}&quot;
                  </div>
                  <div className="mt-1 text-[14px] leading-[20px] text-[#6b655e]">
                    {rec.cols} &times; {rec.rows} = {rec.total} blocks
                  </div>
                  <div className="mt-1 text-[14px] leading-[20px] text-[#6b655e]">
                    Each: {rec.blockSize}&quot; &times; {rec.blockSize}&quot;
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom dimensions */}
          <div className="border-t border-[#e8e1da] pt-6">
            <h3 className="text-[18px] leading-[28px] text-[#2d2a26] mb-3">Custom Dimensions</h3>
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-[14px] leading-[20px] text-[#6b655e] mb-2">Width (in)</label>
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
                  placeholder="Width"
                  min="6"
                  max="200"
                  className="w-full border border-[#e8e1da] bg-[#ffffff] rounded-lg p-3 text-[16px] leading-[24px] text-[#2d2a26] focus:outline-2 focus:outline-[#ff8d49] transition-colors duration-150 placeholder:text-[#6b655e]"
                />
              </div>

              <button
                type="button"
                onClick={() => setLockAspect(!lockAspect)}
                className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center border rounded-lg transition-colors duration-150 ${lockAspect ? 'bg-[#ff8d49] text-[#2d2a26] border-[#ff8d49]' : 'bg-[#ffffff] text-[#6b655e] border-[#e8e1da]'
                  }`}
                title={lockAspect ? 'Aspect ratio locked' : 'Aspect ratio unlocked'}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  {lockAspect ? (
                    <>
                      <rect x="5" y="7" width="6" height="5" rx="0" stroke="currentColor" strokeWidth="2" />
                      <path d="M6 7V5a2 2 0 014 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                    </>
                  ) : (
                    <>
                      <rect x="5" y="7" width="6" height="5" rx="0" stroke="currentColor" strokeWidth="2" />
                      <path d="M6 7V5a2 2 0 013.7-.8" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
                    </>
                  )}
                </svg>
              </button>

              <div className="flex-1">
                <label className="block text-[14px] leading-[20px] text-[#6b655e] mb-2">Height (in)</label>
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
                  placeholder="Height"
                  min="6"
                  max="200"
                  className="w-full border border-[#e8e1da] bg-[#ffffff] rounded-lg p-3 text-[16px] leading-[24px] text-[#2d2a26] focus:outline-2 focus:outline-[#ff8d49] transition-colors duration-150 placeholder:text-[#6b655e]"
                />
              </div>

              <button
                type="button"
                onClick={handleCustomApply}
                disabled={!customWidth || !customHeight}
                className="h-[42px] border border-[#e8e1da] bg-[#ff8d49] text-[#2d2a26] px-6 text-[14px] leading-[20px] hover:bg-[#e67d3f] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-full shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
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
