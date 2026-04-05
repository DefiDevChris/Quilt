'use client';

import { useState, useCallback } from 'react';
import { parseSvgToPatches, computeSewingOrder, mirrorPatches } from '@/lib/fpp-generator';
import { DEFAULT_SEAM_ALLOWANCE_INCHES } from '@/lib/constants';

interface FppExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: Array<{ id: string; name: string; svgData: string }>;
  onGeneratePdf: (options: {
    blockName: string;
    patches: ReturnType<typeof computeSewingOrder>;
    paperSize: 'letter' | 'a4';
    seamAllowance: number;
    showColors: boolean;
    showNumbers: boolean;
  }) => void;
}

export function FppExportDialog({ isOpen, onClose, blocks, onGeneratePdf }: FppExportDialogProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string>(blocks[0]?.id ?? '');
  const [paperSize, setPaperSize] = useState<'letter' | 'a4'>('letter');
  const [seamAllowance, setSeamAllowance] = useState(DEFAULT_SEAM_ALLOWANCE_INCHES);
  const [showColors, setShowColors] = useState(true);
  const [showNumbers, setShowNumbers] = useState(true);
  const [error, setError] = useState('');

  const handleGenerate = useCallback(() => {
    setError('');
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (!block) {
      setError('Please select a block.');
      return;
    }

    const rawPatches = parseSvgToPatches(block.svgData);
    if (rawPatches.length === 0) {
      setError('Selected block has no pieceable patches.');
      return;
    }

    const ordered = computeSewingOrder(rawPatches);
    const mirrored = mirrorPatches(ordered, 100);

    onGeneratePdf({
      blockName: block.name,
      patches: mirrored,
      paperSize,
      seamAllowance,
      showColors,
      showNumbers,
    });
  }, [selectedBlockId, blocks, paperSize, seamAllowance, showColors, showNumbers, onGeneratePdf]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-surface p-6 shadow-elevation-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-on-surface">
            Foundation Paper Piecing Template
          </h2>
          <button type="button" onClick={onClose} className="text-secondary hover:text-on-surface">
            Close
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-sm bg-error/10 px-3 py-2 text-sm text-error">{error}</div>
        )}

        <div className="space-y-4">
          {/* Block Selector */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Block</label>
            <select
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
              className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface"
            >
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Paper Size */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Paper Size</label>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as 'letter' | 'a4')}
              className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface"
            >
              <option value="letter">US Letter (8.5&quot; x 11&quot;)</option>
              <option value="a4">A4 (210mm x 297mm)</option>
            </select>
          </div>

          {/* Seam Allowance */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Seam Allowance</label>
            <input
              type="number"
              min={0.0625}
              max={1}
              step={0.0625}
              value={seamAllowance}
              onChange={(e) => setSeamAllowance(Number(e.target.value))}
              className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface"
            />
          </div>

          {/* Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showColors}
                onChange={(e) => setShowColors(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-sm text-on-surface">Show color coding</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showNumbers}
                onChange={(e) => setShowNumbers(e.target.checked)}
                className="accent-primary"
              />
              <span className="text-sm text-on-surface">Show patch numbers</span>
            </label>
          </div>

          <p className="text-caption text-secondary">
            Template is automatically mirrored for paper piecing (you sew on the back).
          </p>
        </div>

        <div className="flex gap-2 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-secondary hover:bg-background"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!selectedBlockId}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
