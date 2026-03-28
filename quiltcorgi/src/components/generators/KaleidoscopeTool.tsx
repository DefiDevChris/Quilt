'use client';

import { useState, useCallback, useMemo } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { type SourceQuadrant, type KaleidoscopeConfig } from '@/lib/kaleidoscope-engine';

interface KaleidoscopeToolProps {
  isOpen: boolean;
  onClose: () => void;
}

const FOLD_COUNTS = [4, 6, 8, 12] as const;

const QUADRANT_OPTIONS: Array<{ id: SourceQuadrant; label: string; position: string }> = [
  { id: 'top-left', label: 'Top Left', position: 'top-0 left-0' },
  { id: 'top-right', label: 'Top Right', position: 'top-0 right-0' },
  { id: 'bottom-left', label: 'Bottom Left', position: 'bottom-0 left-0' },
  { id: 'bottom-right', label: 'Bottom Right', position: 'bottom-0 right-0' },
];

export function KaleidoscopeTool({ isOpen, onClose }: KaleidoscopeToolProps) {
  const [foldCount, setFoldCount] = useState<4 | 6 | 8 | 12>(6);
  const [sourceQuadrant, setSourceQuadrant] = useState<SourceQuadrant>('top-left');
  const [selectedShapeId, setSelectedShapeId] = useState<string>('');

  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);

  const kaleidoscopeConfig: KaleidoscopeConfig = useMemo(
    () => ({
      foldCount,
      sourceQuadrant,
    }),
    [foldCount, sourceQuadrant]
  );

  const handleGenerateKaleidoscope = useCallback(() => {
    if (!fabricCanvas || !selectedShapeId) return;

    // TODO: integrate with Fabric.js to generate kaleidoscope on canvas
    onClose();
  }, [fabricCanvas, selectedShapeId, kaleidoscopeConfig, onClose]);

  const handleSaveToLibrary = useCallback(() => {
    if (!selectedShapeId) return;

    // Mock implementation - would save kaleidoscope block to library
    // Show success message
    alert('Kaleidoscope block saved to library!');
  }, [selectedShapeId, kaleidoscopeConfig]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h2 className="text-xl font-semibold text-on-surface">Kaleidoscope Generator</h2>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
            aria-label="Close kaleidoscope tool"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Source Shape Selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">Source Shape</label>
            <select
              value={selectedShapeId}
              onChange={(e) => setSelectedShapeId(e.target.value)}
              className="w-full px-3 py-2 border border-outline-variant rounded-md bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Choose a shape...</option>
              <option value="triangle-1">Triangle Patch</option>
              <option value="curve-1">Curved Shape</option>
              <option value="custom-1">Custom Drawing</option>
            </select>
            <p className="text-xs text-on-surface-variant mt-1">
              Select a shape from the canvas or library to use as the kaleidoscope source
            </p>
          </div>

          {/* Fold Count Selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-3">Fold Count</label>
            <div className="grid grid-cols-4 gap-3">
              {FOLD_COUNTS.map((count) => (
                <button
                  key={count}
                  onClick={() => setFoldCount(count)}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    foldCount === count
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-outline-variant text-on-surface hover:border-primary/50'
                  }`}
                >
                  <div className="text-lg font-semibold">{count}</div>
                  <div className="text-xs text-on-surface-variant">-fold</div>
                </button>
              ))}
            </div>
          </div>

          {/* Source Quadrant Selection */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-3">
              Source Quadrant
            </label>
            <div className="relative w-48 h-48 mx-auto border-2 border-outline-variant rounded-lg bg-surface-variant/20">
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                <div className="flex-1 border-r border-outline-variant"></div>
                <div className="flex-1"></div>
              </div>
              <div className="absolute inset-0 flex flex-col">
                <div className="flex-1 border-b border-outline-variant"></div>
                <div className="flex-1"></div>
              </div>

              {/* Quadrant buttons */}
              {QUADRANT_OPTIONS.map((quadrant) => (
                <button
                  key={quadrant.id}
                  onClick={() => setSourceQuadrant(quadrant.id)}
                  className={`absolute w-24 h-24 flex items-center justify-center text-xs font-medium transition-colors ${quadrant.position} ${
                    sourceQuadrant === quadrant.id
                      ? 'bg-primary/20 text-primary border-2 border-primary'
                      : 'hover:bg-primary/10 text-on-surface-variant'
                  }`}
                  title={quadrant.label}
                >
                  {quadrant.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-on-surface-variant text-center mt-2">
              Click a quadrant to select the source area for kaleidoscope generation
            </p>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-on-surface mb-2">
              Kaleidoscope Preview
            </label>
            <div className="border border-outline-variant rounded-lg p-4 bg-surface-variant/20 min-h-[200px] flex items-center justify-center">
              <div className="w-48 h-48 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center">
                <div className="text-on-surface-variant text-sm text-center">
                  {selectedShapeId ? (
                    <>
                      <div className="text-lg mb-1">✺</div>
                      <div>{foldCount}-fold kaleidoscope</div>
                      <div className="text-xs">from {sourceQuadrant}</div>
                    </>
                  ) : (
                    'Select a shape to see preview'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Settings Info */}
          <div className="bg-surface-variant/10 rounded-lg p-4">
            <h3 className="text-sm font-medium text-on-surface mb-2">Current Settings</h3>
            <div className="space-y-1 text-sm text-on-surface-variant">
              <div>Fold Count: {foldCount}-fold symmetry</div>
              <div>
                Source: {QUADRANT_OPTIONS.find((q) => q.id === sourceQuadrant)?.label} quadrant
              </div>
              <div>Pattern: Radial symmetry with mirroring within each wedge</div>
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
            disabled={!selectedShapeId}
            className="px-4 py-2 border border-outline-variant text-on-surface rounded-md hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Save to Library
          </button>
          <button
            onClick={handleGenerateKaleidoscope}
            disabled={!selectedShapeId}
            className="px-4 py-2 bg-primary text-on-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
