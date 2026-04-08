'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUILT_SIZE_PRESETS } from '@/lib/constants';

interface NewProjectWizardProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

type StartingPoint = 'freeform' | 'create-layout';

const CELL_SIZE_OPTIONS = [0.25, 0.5, 1, 2, 3] as const;

function fmtCellSize(inches: number): string {
  if (inches === 0.25) return '¼"';
  if (inches === 0.5) return '½"';
  return `${inches}"`;
}

export function NewProjectWizard({ open, onClose }: NewProjectWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [startingPoint, setStartingPoint] = useState<StartingPoint>('freeform');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Step 3: Size + cell size
  const [sizePresetLabel, setSizePresetLabel] = useState<string>('Throw');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [cellSize, setCellSize] = useState(1);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // Reset on close
  useEffect(() => {
    if (!open) return;
    return () => {
      setStep(1);
      setName('');
      setError(null);
      setIsCreating(false);
      setStartingPoint('freeform');
      setSizePresetLabel('Throw');
      setCustomWidth('');
      setCustomHeight('');
      setCellSize(1);
    };
  }, [open]);

  // Focus management
  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    const node = dialogRef.current;
    node?.focus();
    return () => {
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  // Escape closes
  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const sizePreset = useMemo(() => {
    const found = QUILT_SIZE_PRESETS.find((p) => p.label === sizePresetLabel);
    return found ?? null;
  }, [sizePresetLabel]);

  const isCustom = sizePresetLabel === 'Custom';

  const canSubmit = useMemo(() => {
    if (isCreating || !name.trim()) return false;
    if (isCustom) {
      const w = parseFloat(customWidth);
      const h = parseFloat(customHeight);
      return !isNaN(w) && !isNaN(h) && w > 0 && h > 0;
    }
    return true;
  }, [isCreating, name, isCustom, customWidth, customHeight]);

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);
    setIsCreating(true);

    let canvasWidth = 48;
    let canvasHeight = 48;

    if (isCustom) {
      canvasWidth = parseFloat(customWidth);
      canvasHeight = parseFloat(customHeight);
    } else if (sizePreset) {
      canvasWidth = sizePreset.width;
      canvasHeight = sizePreset.height;
    }

    const payload: Record<string, unknown> = {
      name: name.trim(),
      unitSystem: 'imperial' as const,
      canvasWidth,
      canvasHeight,
      gridSettings: { enabled: true, size: cellSize, snapToGrid: true },
    };

    if (startingPoint === 'create-layout') {
      payload.layoutBuilder = {
        width: canvasWidth,
        height: canvasHeight,
        cellSize,
      };
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent('/dashboard')}`;
          return;
        }
        let message = 'Failed to create project';
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          /* ignore */
        }
        setError(message);
        setIsCreating(false);
        return;
      }

      const data = (await res.json()) as { data?: { id?: string } };
      const newId = data?.data?.id;
      if (!newId) {
        setError('Server returned no project id');
        setIsCreating(false);
        return;
      }

      // Store selected dimensions so NewQuiltSetupModal can pre-fill them
      sessionStorage.setItem(`qc-quilt-setup-dimensions-${newId}`, JSON.stringify({ width: canvasWidth, height: canvasHeight }));

      // Note: We intentionally do NOT suppress the NewQuiltSetupModal.
      // The modal will appear in the studio to confirm/finalize the dimensions.
      if (startingPoint === 'create-layout') {
        sessionStorage.setItem(`qc-layout-builder-${newId}`, 'true');
      }

      onClose();
      router.push(`/studio/${newId}`);
    } catch {
      setError('Failed to create project');
      setIsCreating(false);
    }
  }, [canSubmit, name, isCustom, customWidth, customHeight, sizePreset, cellSize, startingPoint, onClose, router]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-wizard-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-elevation-3 focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
          <h2 id="new-project-wizard-title" className="text-xl font-extrabold text-on-surface tracking-tight">
            New Project
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-md bg-error/10 border border-error/20 px-4 py-2 text-sm text-error">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-6 min-h-[300px] flex flex-col">
          {/* ─── Step 1: Name ─── */}
          {step === 1 && (
            <div className="space-y-6 flex-1">
              <div>
                <label
                  htmlFor="wizard-name"
                  className="block text-sm font-semibold uppercase tracking-wider text-secondary mb-3"
                >
                  Name your project
                </label>
                <input
                  id="wizard-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                  placeholder="e.g. My Next Masterpiece"
                  className="w-full rounded-xl border border-outline-variant bg-surface px-4 py-3 text-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-sm"
                  autoFocus
                />
              </div>
              <div className="flex justify-end pt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 2: Choose a Starting Point ─── */}
          {step === 2 && (
            <div className="space-y-6 flex-1 flex flex-col">
              <label className="block text-sm font-semibold uppercase tracking-wider text-secondary mb-2">
                Choose a Starting Point
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Freeform */}
                <button
                  type="button"
                  onClick={() => setStartingPoint('freeform')}
                  className={`flex flex-col items-center p-8 rounded-2xl border-2 transition-all ${startingPoint === 'freeform'
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant bg-surface hover:bg-surface-container'
                    }`}
                >
                  <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-secondary">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>
                  </div>
                  <span className="font-bold text-on-surface text-lg mb-1">Freeform</span>
                  <span className="text-xs text-secondary text-center">Start with an empty canvas — place blocks, fabrics, and shapes anywhere.</span>
                </button>

                {/* Create a Layout */}
                <button
                  type="button"
                  onClick={() => setStartingPoint('create-layout')}
                  className={`flex flex-col items-center p-8 rounded-2xl border-2 transition-all ${startingPoint === 'create-layout'
                    ? 'border-primary bg-primary/5'
                    : 'border-outline-variant bg-surface hover:bg-surface-container'
                    }`}
                >
                  <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center mb-4">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-secondary">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
                      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                      <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                      <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                      <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
                    </svg>
                  </div>
                  <span className="font-bold text-on-surface text-lg mb-1">Create a Layout</span>
                  <span className="text-xs text-secondary text-center">Draw your own layout on a reference grid — define borders, sashing, block cells, and more.</span>
                </button>
              </div>

              <div className="flex justify-between items-end flex-1 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-container transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* ─── Step 3: Quilt Size + Cell Size ─── */}
          {step === 3 && (
            <div className="space-y-6 flex-1 flex flex-col">
              <label className="block text-sm font-semibold uppercase tracking-wider text-secondary mb-2">
                Quilt Size
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {QUILT_SIZE_PRESETS.map((preset) => {
                  const isActive = sizePresetLabel === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSizePresetLabel(preset.label)}
                      className={
                        isActive
                          ? 'flex flex-col items-center justify-center rounded-xl p-3 bg-gradient-to-r from-primary to-primary-dark text-white shadow-md'
                          : 'flex flex-col items-center justify-center rounded-xl p-3 bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors'
                      }
                    >
                      <span className="text-sm font-bold mb-1">{preset.label}</span>
                      <span className={isActive ? 'text-xs font-mono text-white/80' : 'text-xs font-mono text-secondary'}>
                        {preset.width}″ × {preset.height}″
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSizePresetLabel('Custom')}
                  className={
                    isCustom
                      ? 'w-full rounded-xl px-4 py-3 bg-gradient-to-r from-primary to-primary-dark text-white text-sm font-bold shadow-md'
                      : 'w-full rounded-xl px-4 py-3 bg-surface-container text-on-surface text-sm font-bold hover:bg-surface-container-high transition-colors border border-outline-variant/30'
                  }
                >
                  Custom Size
                </button>
              </div>

              {isCustom && (
                <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-surface-container rounded-xl">
                  <div>
                    <label htmlFor="wizard-w" className="block text-xs font-medium text-secondary mb-1">
                      Width (inches)
                    </label>
                    <input
                      id="wizard-w"
                      type="number"
                      min={1}
                      max={200}
                      step={0.5}
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 60"
                    />
                  </div>
                  <div>
                    <label htmlFor="wizard-h" className="block text-xs font-medium text-secondary mb-1">
                      Height (inches)
                    </label>
                    <input
                      id="wizard-h"
                      type="number"
                      min={1}
                      max={200}
                      step={0.5}
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50"
                      placeholder="e.g. 72"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold uppercase tracking-wider text-secondary mb-2">
                  Grid Cell Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {CELL_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setCellSize(size)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${Math.abs(cellSize - size) < 0.001
                        ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-elevation-1'
                        : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                        }`}
                    >
                      {fmtCellSize(size)}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-secondary mt-2">
                  The reference grid spacing for your layout. Each cell = {fmtCellSize(cellSize)}.
                </p>
              </div>

              <div className="flex justify-between items-end flex-1 pt-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="rounded-full px-5 py-2.5 text-sm font-semibold text-secondary hover:bg-surface-container transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!canSubmit}
                  className="rounded-full px-8 py-2.5 text-sm font-bold bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isCreating ? 'Creating…' : startingPoint === 'create-layout' ? 'Start Building Layout' : 'Create Project'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
