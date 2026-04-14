'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDesignerStore } from '@/stores/designerStore';

/**
 * LayoutConfigPanel — simple grid configuration for the designer.
 * Provides sliders for rows, cols, block size, and sashing width.
 * Shows live total size computation.
 * Updates designerStore which triggers fence re-render.
 */
interface LayoutConfigPanelProps {
  quiltWidthIn?: number;
  quiltHeightIn?: number;
}

export function LayoutConfigPanel({
  quiltWidthIn = 60,
  quiltHeightIn = 80,
}: LayoutConfigPanelProps) {
  const rows = useDesignerStore((s) => s.rows);
  const cols = useDesignerStore((s) => s.cols);
  const blockSize = useDesignerStore((s) => s.blockSize);
  const sashingWidth = useDesignerStore((s) => s.sashingWidth);
  const borders = useDesignerStore((s) => s.borders);

  const setRows = useDesignerStore((s) => s.setRows);
  const setCols = useDesignerStore((s) => s.setCols);
  const setBlockSize = useDesignerStore((s) => s.setBlockSize);
  const setSashing = useDesignerStore((s) => s.setSashing);

  // Local state for slider values to avoid lag during drag
  const [localRows, setLocalRows] = useState(rows);
  const [localCols, setLocalCols] = useState(cols);
  const [localBlockSize, setLocalBlockSize] = useState(blockSize);
  const [localSashingWidth, setLocalSashingWidth] = useState(sashingWidth);

  // Sync local state when store changes externally
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  useEffect(() => {
    setLocalCols(cols);
  }, [cols]);

  useEffect(() => {
    setLocalBlockSize(blockSize);
  }, [blockSize]);

  useEffect(() => {
    setLocalSashingWidth(sashingWidth);
  }, [sashingWidth]);

  const handleRowsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      setLocalRows(val);
      setRows(val);
    },
    [setRows]
  );

  const handleColsChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      setLocalCols(val);
      setCols(val);
    },
    [setCols]
  );

  const handleBlockSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setLocalBlockSize(val);
      setBlockSize(val);
    },
    [setBlockSize]
  );

  const handleSashingWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setLocalSashingWidth(val);
      setSashing(val);
    },
    [setSashing]
  );

  // Compute total content size
  const contentWidthIn = cols * blockSize + Math.max(0, cols - 1) * sashingWidth;
  const contentHeightIn = rows * blockSize + Math.max(0, rows - 1) * sashingWidth;

  const totalBorderWidth = borders.reduce((sum, b) => sum + b.width, 0);
  const totalWidthIn = contentWidthIn + totalBorderWidth * 2;
  const totalHeightIn = contentHeightIn + totalBorderWidth * 2;

  const fitsInQuilt = totalWidthIn <= quiltWidthIn && totalHeightIn <= quiltHeightIn;

  return (
    <div className="flex flex-col w-full flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
      <h3 className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)]">
        Layout Configuration
      </h3>

      {/* Rows */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="rows-slider"
            className="text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)]"
          >
            Rows
          </label>
          <span className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)] tabular-nums">
            {localRows}
          </span>
        </div>
        <input
          id="rows-slider"
          type="range"
          min={1}
          max={10}
          step={1}
          value={localRows}
          onChange={handleRowsChange}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-text-dim)]">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      {/* Columns */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="cols-slider"
            className="text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)]"
          >
            Columns
          </label>
          <span className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)] tabular-nums">
            {localCols}
          </span>
        </div>
        <input
          id="cols-slider"
          type="range"
          min={1}
          max={10}
          step={1}
          value={localCols}
          onChange={handleColsChange}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-text-dim)]">
          <span>1</span>
          <span>10</span>
        </div>
      </div>

      {/* Block Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="blocksize-slider"
            className="text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)]"
          >
            Block Size (inches)
          </label>
          <span className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)] tabular-nums">
            {localBlockSize}&quot;
          </span>
        </div>
        <input
          id="blocksize-slider"
          type="range"
          min={4}
          max={24}
          step={0.5}
          value={localBlockSize}
          onChange={handleBlockSizeChange}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-text-dim)]">
          <span>4&quot;</span>
          <span>24&quot;</span>
        </div>
      </div>

      {/* Sashing Width */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label
            htmlFor="sashing-slider"
            className="text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)]"
          >
            Sashing Width (inches)
          </label>
          <span className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)] tabular-nums">
            {localSashingWidth}&quot;
          </span>
        </div>
        <input
          id="sashing-slider"
          type="range"
          min={0.5}
          max={6}
          step={0.25}
          value={localSashingWidth}
          onChange={handleSashingWidthChange}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="flex justify-between text-[10px] text-[var(--color-text-dim)]">
          <span>0.5&quot;</span>
          <span>6&quot;</span>
        </div>
      </div>

      {/* DIVIDER */}
      <div className="border-t border-[var(--color-border)]/30" />

      {/* Live Total Size */}
      <div className="space-y-2 p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]/20">
        <h4 className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)]">
          Total Size
        </h4>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-text-dim)]">Content</span>
            <span className="text-[var(--color-text)] tabular-nums">
              {contentWidthIn.toFixed(1)}&quot; × {contentHeightIn.toFixed(1)}&quot;
            </span>
          </div>
          {borders.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-dim)]">+ Borders</span>
              <span className="text-[var(--color-text)] tabular-nums">
                +{totalBorderWidth * 2}&quot; each side
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold border-t border-[var(--color-border)]/20 pt-1 mt-1">
            <span className="text-[var(--color-text)]">Total</span>
            <span className="tabular-nums">
              {totalWidthIn.toFixed(1)}&quot; × {totalHeightIn.toFixed(1)}&quot;
            </span>
          </div>
        </div>

        {/* Quilt fit indicator */}
        <div
          className={`flex items-center gap-1.5 text-xs mt-2 ${
            fitsInQuilt ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'
          }`}
        >
          <span className="inline-block w-2 h-2 rounded-full bg-current" />
          {fitsInQuilt
            ? `Fits in ${quiltWidthIn}&quot; × ${quiltHeightIn}&quot; quilt`
            : `Exceeds ${quiltWidthIn}&quot; × ${quiltHeightIn}&quot; quilt`}
        </div>
      </div>

      {/* Grid preview */}
      <div className="space-y-2">
        <h4 className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)]">
          Grid Preview
        </h4>
        <div className="flex items-center justify-center py-4">
          <div
            className="inline-grid gap-0 border-2 border-[var(--color-border)] rounded-sm"
            style={{
              gridTemplateColumns: `repeat(${localCols}, 1fr)`,
              width: `${Math.min(localCols * 24, 200)}px`,
              height: `${Math.min(localRows * 24, 200)}px`,
            }}
          >
            {Array.from({ length: localRows * localCols }).map((_, i) => (
              <div
                key={i}
                className="border border-[var(--color-border)]/40 bg-[var(--color-surface)]"
                style={{
                  margin: localSashingWidth > 0 ? `${Math.min(localSashingWidth * 2, 8)}px` : '0',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
