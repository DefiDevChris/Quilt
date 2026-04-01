'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useColorwayTool } from '@/hooks/useColorwayTool';
import { generateColorScheme, type ColorSchemeType } from '@/lib/colorway-utils';

const DEFAULT_PALETTE = [
  '#D4883C', '#8B4513', '#F5DEB3', '#2E4057',
  '#7B3F00', '#A0522D', '#DEB887', '#C9B896',
];

const COLOR_SCHEMES: Array<{ id: ColorSchemeType; label: string }> = [
  { id: 'monochromatic', label: 'Monochromatic' },
  { id: 'analogous', label: 'Analogous' },
  { id: 'complementary', label: 'Complementary' },
  { id: 'triadic', label: 'Triadic' },
  { id: 'split-complementary', label: 'Split Comp.' },
  { id: 'tetradic', label: 'Tetradic' },
];

export function ColorwayTools() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [swapColorA, setSwapColorA] = useState('#D4883C');
  const [swapColorB, setSwapColorB] = useState('#2E4057');
  const [palette, setPalette] = useState(DEFAULT_PALETTE);
  const [selectedScheme, setSelectedScheme] = useState<ColorSchemeType>('analogous');
  const [baseColor, setBaseColor] = useState('#D4883C');
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setActiveTool = useCanvasStore((s) => s.setActiveTool);
  const { executeSwap, executeRandomize } = useColorwayTool();

  const handleSpraycan = useCallback(() => {
    setActiveTool(activeTool === 'spraycan' ? 'select' : 'spraycan');
  }, [activeTool, setActiveTool]);

  const handleEyedropper = useCallback(() => {
    setActiveTool(activeTool === 'eyedropper' ? 'select' : 'eyedropper');
  }, [activeTool, setActiveTool]);

  const handleSwap = useCallback(() => {
    executeSwap(swapColorA, swapColorB);
  }, [executeSwap, swapColorA, swapColorB]);

  const handleRandomize = useCallback(() => {
    executeRandomize(palette);
  }, [executeRandomize, palette]);

  const handlePaletteColorChange = useCallback(
    (index: number, color: string) => {
      setPalette((prev) => [
        ...prev.slice(0, index),
        color,
        ...prev.slice(index + 1),
      ]);
    },
    []
  );

  const handleGenerateScheme = useCallback(() => {
    const newPalette = generateColorScheme(baseColor, selectedScheme, 8);
    setPalette(newPalette);
  }, [baseColor, selectedScheme]);

  const handleApplyScheme = useCallback(() => {
    executeRandomize(palette);
  }, [executeRandomize, palette]);

  return (
    <div className="border-t border-outline-variant/10 pt-1">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between px-1 py-1 text-[10px] font-medium uppercase tracking-wider text-secondary"
      >
        Colorway
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        >
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {isExpanded && (
        <div className="space-y-2 pb-2">
          {/* Spraycan + Eyedropper row */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleSpraycan}
              title="Spraycan — click patch to recolor all matching"
              className={`flex-1 h-8 rounded text-xs font-medium ${
                activeTool === 'spraycan'
                  ? 'bg-primary text-white'
                  : 'bg-background text-secondary hover:text-on-surface'
              }`}
            >
              Spray
            </button>
            <button
              type="button"
              onClick={handleEyedropper}
              title="Eyedropper — pick color from patch"
              className={`flex-1 h-8 rounded text-xs font-medium ${
                activeTool === 'eyedropper'
                  ? 'bg-primary text-white'
                  : 'bg-background text-secondary hover:text-on-surface'
              }`}
            >
              Pick
            </button>
          </div>

          {/* Swap Colors */}
          <div>
            <span className="text-[10px] text-secondary block mb-1">Swap Colors</span>
            <div className="flex items-center gap-1">
              <input
                type="color"
                value={swapColorA}
                onChange={(e) => setSwapColorA(e.target.value)}
                className="w-7 h-6 rounded-sm border border-outline-variant cursor-pointer"
                title="Color A"
              />
              <svg width="14" height="14" viewBox="0 0 14 14" className="text-secondary">
                <path d="M3 7H11M8 4L11 7L8 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
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
                className="ml-auto rounded bg-background px-2 py-1 text-[10px] text-secondary hover:text-on-surface"
              >
                Swap
              </button>
            </div>
          </div>

          {/* Randomize */}
          <div>
            <span className="text-[10px] text-secondary block mb-1">Randomize Palette</span>
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
              className="w-full rounded bg-background px-2 py-1.5 text-[10px] font-medium text-secondary hover:text-on-surface"
            >
              Shuffle
            </button>
          </div>

          {/* Color Scheme Generator */}
          <div>
            <span className="text-[10px] text-secondary block mb-1">Suggest Palette</span>
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
                  className="flex-1 text-[10px] bg-background border border-outline-variant rounded px-1 py-1 text-secondary"
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
                  className="flex-1 rounded bg-background px-2 py-1 text-[10px] text-secondary hover:text-on-surface"
                >
                  Generate
                </button>
                <button
                  type="button"
                  onClick={handleApplyScheme}
                  className="flex-1 rounded bg-primary px-2 py-1 text-[10px] text-white hover:bg-primary/90"
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
