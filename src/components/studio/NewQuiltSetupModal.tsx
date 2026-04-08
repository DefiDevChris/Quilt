'use client';

import { useCallback, useEffect, useState } from 'react';
import { QUILT_SIZE_PRESETS } from '@/lib/constants';

interface Props {
  readonly isOpen: boolean;
  readonly projectId: string;
  readonly onConfirm: (args: { width: number; height: number; startingPoint?: 'freeform' | 'create-layout' }) => void;
  readonly onDismiss: () => void;
}

type StartingPoint = 'freeform' | 'create-layout';

/**
 * First-visit setup modal for a brand-new quilt project. The user picks
 * a finished quilt size (preset or custom) and a starting point.
 */
export function NewQuiltSetupModal({ isOpen, projectId, onConfirm, onDismiss }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [startingPoint, setStartingPoint] = useState<StartingPoint>('freeform');
  const [selectedPreset, setSelectedPreset] = useState<string>('Throw');
  const [customW, setCustomW] = useState('');
  const [customH, setCustomH] = useState('');

  // Try to read pre-filled dimensions from the wizard
  useEffect(() => {
    if (!isOpen || !projectId) return;
    const key = `qc-quilt-setup-dimensions-${projectId}`;
    if (typeof window === 'undefined') return;
    const stored = window.sessionStorage.getItem(key);
    if (!stored) return;
    try {
      const dims = JSON.parse(stored) as { width: number; height: number };
      if (dims.width && dims.height) {
        // Find matching preset or set to Custom
        const matchingPreset = QUILT_SIZE_PRESETS.find(
          (p) => p.width === dims.width && p.height === dims.height
        );
        if (matchingPreset) {
          setSelectedPreset(matchingPreset.label);
        } else {
          setSelectedPreset('Custom');
          setCustomW(String(dims.width));
          setCustomH(String(dims.height));
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [isOpen, projectId]);

  const isCustom = selectedPreset === 'Custom';

  const handleConfirm = useCallback(() => {
    let width: number;
    let height: number;
    if (isCustom) {
      width = parseFloat(customW);
      height = parseFloat(customH);
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        return;
      }
    } else {
      const preset = QUILT_SIZE_PRESETS.find((p) => p.label === selectedPreset);
      if (!preset) return;
      width = preset.width;
      height = preset.height;
    }
    onConfirm({ width, height, startingPoint });
  }, [isCustom, customW, customH, selectedPreset, startingPoint, onConfirm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-surface shadow-elevation-3 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-on-surface mb-1">
            {step === 1 ? 'New Quilt' : 'Choose a Starting Point'}
          </h2>
          <p className="text-sm text-secondary">
            {step === 1
              ? 'Pick the finished size of your quilt. You can change this any time from the right pane.'
              : 'How would you like to start designing?'}
          </p>
        </div>

        {/* Step 1: Size selection */}
        {step === 1 && (
          <>
            {/* Preset grid */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {QUILT_SIZE_PRESETS.map((preset) => {
                const isActive = selectedPreset === preset.label;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setSelectedPreset(preset.label)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors ${isActive
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-elevation-1'
                      : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                      }`}
                  >
                    <span className="text-sm font-medium">{preset.label}</span>
                    <span
                      className={`text-xs font-mono ${isActive ? 'text-white/80' : 'text-secondary'}`}
                    >
                      {preset.width}″ × {preset.height}″
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setSelectedPreset('Custom')}
                className={`col-span-2 flex items-center justify-center rounded-lg px-3 py-2.5 transition-colors ${isCustom
                  ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-elevation-1'
                  : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                  }`}
              >
                <span className="text-sm font-medium">Custom Size</span>
              </button>
            </div>

            {/* Custom inputs */}
            {isCustom && (
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label htmlFor="custom-w" className="block text-xs text-secondary mb-1">
                    Width (inches)
                  </label>
                  <input
                    id="custom-w"
                    type="number"
                    min={1}
                    max={144}
                    step={0.5}
                    value={customW}
                    onChange={(e) => setCustomW(e.target.value)}
                    placeholder="e.g. 60"
                    className="w-full rounded-md bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor="custom-h" className="block text-xs text-secondary mb-1">
                    Height (inches)
                  </label>
                  <input
                    id="custom-h"
                    type="number"
                    min={1}
                    max={144}
                    step={0.5}
                    value={customH}
                    onChange={(e) => setCustomH(e.target.value)}
                    placeholder="e.g. 72"
                    className="w-full rounded-md bg-surface-container px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onDismiss}
                className="bg-white/50 px-4 py-2 text-sm font-medium text-secondary rounded-full"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isCustom && (!customW || !customH)}
                className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Next Step
              </button>
            </div>
          </>
        )}

        {/* Step 2: Starting point selection */}
        {step === 2 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Freeform */}
              <button
                type="button"
                onClick={() => setStartingPoint('freeform')}
                className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${startingPoint === 'freeform'
                  ? 'border-primary bg-primary/5'
                  : 'border-outline-variant bg-surface-container hover:bg-surface-container-high'
                  }`}
              >
                <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-secondary">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                  </svg>
                </div>
                <span className="font-bold text-on-surface text-base mb-1">Freeform</span>
                <span className="text-xs text-secondary text-center">Start with an empty canvas — place blocks, fabrics, and shapes anywhere.</span>
              </button>

              {/* Start with a Layout */}
              <button
                type="button"
                onClick={() => setStartingPoint('create-layout')}
                className={`flex flex-col items-center p-6 rounded-xl border-2 transition-all ${startingPoint === 'create-layout'
                  ? 'border-primary bg-primary/5'
                  : 'border-outline-variant bg-surface-container hover:bg-surface-container-high'
                  }`}
              >
                <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center mb-3">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-secondary">
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                    <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                    <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                    <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                    <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                  </svg>
                </div>
                <span className="font-bold text-on-surface text-base mb-1">Start with a Layout</span>
                <span className="text-xs text-secondary text-center">Draw your own layout on a reference grid — define borders, sashing, block cells, and more.</span>
              </button>
            </div>

            <div className="flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="bg-white/50 px-4 py-2 text-sm font-medium text-secondary rounded-full"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-5 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                {startingPoint === 'create-layout' ? 'Start Building Layout' : 'Create Quilt'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
