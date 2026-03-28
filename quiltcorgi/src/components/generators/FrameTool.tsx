'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { type FrameStyle } from '@/lib/frame-engine';

interface FrameToolProps {
  isOpen: boolean;
  onClose: () => void;
}

const FRAME_STYLES: Array<{ id: FrameStyle; label: string; icon: string }> = [
  { id: 'simple-border', label: 'Simple Border', icon: '⬜' },
  { id: 'double-border', label: 'Double Border', icon: '⬛' },
  { id: 'sawtooth', label: 'Sawtooth', icon: '🔺' },
  { id: 'flying-geese', label: 'Flying Geese', icon: '🔻' },
  { id: 'piano-keys', label: 'Piano Keys', icon: '🎹' },
  { id: 'cornerstone', label: 'Cornerstone', icon: '💎' },
];

const CORNER_TREATMENTS = [
  { id: 'mitered', label: 'Mitered' },
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
] as const;

export function FrameTool({ isOpen, onClose }: FrameToolProps) {
  const [selectedStyle, setSelectedStyle] = useState<FrameStyle>('simple-border');
  const [frameWidth, setFrameWidth] = useState(1.0);
  const [frameColor, setFrameColor] = useState('#8d4f00');
  const [cornerTreatment, setCornerTreatment] = useState<'mitered' | 'square' | 'rounded'>(
    'mitered'
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');

  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const handleApplyFrame = useCallback(() => {
    if (!fabricCanvas || !selectedBlockId) return;

    // Frame application not yet implemented
    onClose();
  }, [fabricCanvas, selectedBlockId, onClose]);

  const handleSaveToLibrary = useCallback(() => {
    if (!selectedBlockId) return;

    // Save to library not yet implemented
  }, [selectedBlockId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h2 className="text-xl font-semibold text-on-surface">Frame Generator</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close frame tool"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Block Selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Select Block</label>
            <select
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose a block...</option>
              <option value="ohio-star">Ohio Star</option>
              <option value="log-cabin">Log Cabin</option>
              <option value="flying-geese">Flying Geese</option>
            </select>
          </div>

          {/* Frame Style Selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-3">Frame Style</label>
            <div className="grid grid-cols-2 gap-3">
              {FRAME_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedStyle === style.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant text-on-surface hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{style.icon}</span>
                    <span className="text-sm font-medium">{style.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Frame Width */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Frame Width: {frameWidth}&quot;
            </label>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.25"
              value={frameWidth}
              onChange={(e) => setFrameWidth(parseFloat(e.target.value))}
              className="w-full h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-on-surface-variant mt-1">
              <span>0.25&quot;</span>
              <span>3&quot;</span>
            </div>
          </div>

          {/* Frame Color */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Frame Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={frameColor}
                onChange={(e) => setFrameColor(e.target.value)}
                className="w-12 h-12 border border-outline-variant rounded cursor-pointer"
              />
              <input
                type="text"
                value={frameColor}
                onChange={(e) => setFrameColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-outline-variant rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="#8d4f00"
              />
            </div>
          </div>

          {/* Corner Treatment */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Corner Treatment
            </label>
            <div className="flex gap-2">
              {CORNER_TREATMENTS.map((treatment) => (
                <button
                  key={treatment.id}
                  onClick={() => setCornerTreatment(treatment.id)}
                  className={`px-4 py-2 border rounded-md text-sm transition-colors ${
                    cornerTreatment === treatment.id
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant text-on-surface hover:border-primary/50'
                  }`}
                >
                  {treatment.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Preview</label>
            <div className="border border-outline-variant rounded-lg p-4 bg-surface-variant/20 min-h-[200px] flex items-center justify-center">
              <div className="text-on-surface-variant text-sm">
                {selectedBlockId
                  ? `${selectedStyle} frame preview`
                  : 'Select a block to see preview'}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-outline-variant/10">
          <button
            onClick={onClose}
            className="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveToLibrary}
            disabled={!selectedBlockId}
            className="px-4 py-2 border border-outline-variant text-on-surface rounded-md hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save to Library
          </button>
          <button
            onClick={handleApplyFrame}
            disabled={!selectedBlockId}
            className="px-4 py-2 bg-primary text-on-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
