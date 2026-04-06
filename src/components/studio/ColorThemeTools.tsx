'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useColorThemeTool } from '@/hooks/useColorThemeTool';
import { generateColorScheme, type ColorSchemeType } from '@/lib/colortheme-utils';
import { DEFAULT_QUILT_PALETTE } from '@/lib/constants';

const COLOR_SCHEMES: Array<{ id: ColorSchemeType; label: string }> = [
  { id: 'monochromatic', label: 'Monochromatic' },
  { id: 'analogous', label: 'Analogous' },
  { id: 'complementary', label: 'Complementary' },
  { id: 'triadic', label: 'Triadic' },
  { id: 'split-complementary', label: 'Split Comp.' },
  { id: 'tetradic', label: 'Tetradic' },
];

export function ColorThemeTools() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [swapColorA, setSwapColorA] = useState('#D4883C');
  const [swapColorB, setSwapColorB] = useState('#2E4057');
  const [palette, setPalette] = useState<string[]>([...DEFAULT_QUILT_PALETTE].slice(0, 8));
  const [selectedScheme, setSelectedScheme] = useState<ColorSchemeType>('analogous');
  const [baseColor, setBaseColor] = useState('#D4883C');
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const { executeSwap, executeRandomize } = useColorThemeTool();

  const handleSpraycan = useCallback(() => {
    setActiveTool(activeTool === 'spraycan' ? 'select' : 'spraycan');
  }, [activeTool, setActiveTool]);

  const handleSwap = useCallback(() => {
    executeSwap(swapColorA, swapColorB);
  }, [executeSwap, swapColorA, swapColorB]);

  const handleRandomize = useCallback(() => {
    executeRandomize(palette);
  }, [executeRandomize, palette]);

  const handlePaletteColorChange = useCallback((index: number, color: string) => {
    setPalette((prev) => [...prev.slice(0, index), color, ...prev.slice(index + 1)]);
  }, []);

  const handleGenerateScheme = useCallback(() => {
    const newPalette = generateColorScheme(baseColor, selectedScheme, 8);
    setPalette(newPalette);
  }, [baseColor, selectedScheme]);

  const handleApplyScheme = useCallback(() => {
    executeRandomize(palette);
  }, [executeRandomize, palette]);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between py-1 text-label-sm font-semibold uppercase tracking-[0.06em] text-on-surface/70 hover:text-on-surface transition-colors"
      >
        Colorway
        <svg
          width="14"
          height="14"
          viewBox="0 0 12 12"
          className={`transition-transform duration-200 text-on-surface/50 ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      </button>

      {isExpanded && (
        <div className="space-y-2 pb-2">
          {/* Spraycan */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleSpraycan}
              title="Spraycan — click patch to recolor all matching"
              className={`flex-1 h-8 rounded text-xs font-medium ${
                activeTool === 'spraycan'
                  ? 'bg-primary text-white'
                  : 'bg-surface-container text-on-surface/70 hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              Spray
            </button>
          </div>

          {/* Swap Colors */}
          <div>
            <span className="text-label-sm text-on-surface/70 font-medium block mb-1">
              Swap Colors
            </span>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={swapColorA}
                onChange={(e) => setSwapColorA(e.target.value)}
                className="w-7 h-6 rounded-sm border border-outline-variant cursor-pointer"
                title="Color A"
              />
              <svg width="14" height="14" viewBox="0 0 14 14" className="text-secondary">
                <path
                  d="M3 7H11M8 4L11 7L8 10"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              <input
                type="color"
                value={swapColorB}
                onChange={(e) => setSwapColorB(e.target.value)}
                className="w-7 h-6 rounded-sm border border-outline-variant cursor-pointer"
                title="Color B"
              />
              <button
                type="button"
                onClick={handleSwap}
                className="ml-auto rounded bg-surface-container px-2 py-1 text-caption text-on-surface/70 font-medium hover:text-on-surface hover:bg-surface-container-high"
              >
                Swap
              </button>
            </div>
          </div>

          {/* Randomize */}
          <div>
            <span className="text-label-sm text-on-surface/70 font-medium block mb-1">
              Randomize Palette
            </span>
            <div className="flex flex-wrap gap-1 mb-1">
              {palette.map((color, i) => (
                <input
                  key={`palette-${color}-${i}`}
                  type="color"
                  value={color}
                  onChange={(e) => handlePaletteColorChange(i, e.target.value)}
                  className="w-5 h-5 rounded-sm border border-outline-variant/30 cursor-pointer"
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleRandomize}
              className="w-full rounded bg-surface-container px-2 py-1.5 text-caption font-medium text-on-surface/70 hover:text-on-surface hover:bg-surface-container-high"
            >
              Shuffle
            </button>
          </div>

          {/* Color Scheme Generator */}
          <div>
            <span className="text-label-sm text-on-surface/70 font-medium block mb-1">
              Suggest Palette
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                <input
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="w-7 h-6 rounded-sm border border-outline-variant cursor-pointer"
                  title="Base Color"
                />
                <select
                  value={selectedScheme}
                  onChange={(e) => setSelectedScheme(e.target.value as ColorSchemeType)}
                  className="flex-1 text-caption bg-surface-container border border-outline-variant/20 rounded px-1 py-1 text-on-surface/70"
                >
                  {COLOR_SCHEMES.map((scheme) => (
                    <option key={scheme.id} value={scheme.id}>
                      {scheme.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={handleGenerateScheme}
                  className="flex-1 rounded bg-surface-container px-2 py-1 text-caption text-on-surface/70 font-medium hover:text-on-surface hover:bg-surface-container-high"
                >
                  Generate
                </button>
                <button
                  type="button"
                  onClick={handleApplyScheme}
                  className="flex-1 rounded bg-primary px-2 py-1 text-caption text-white hover:bg-primary/90"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
