'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUILT_SIZE_PRESETS } from '@/lib/constants';

const CELL_SIZE_OPTIONS = [0.25, 0.5, 1, 2, 3] as const;

function fmtCellSize(inches: number): string {
  if (inches === 0.25) return '¼"';
  if (inches === 0.5) return '½"';
  return `${inches}"`;
}

/** Full-creation mode (Dashboard): 2 steps, API create, navigate to studio */
interface NewProjectWizardModeNew {
  mode?: 'new-project';
}

/** Studio setup mode: 1 step, calls onConfirm with dimensions */
interface NewProjectWizardModeStudio {
  mode: 'studio';
  projectId: string;
  onConfirm: (args: { width: number; height: number }) => void;
  onDismiss: () => void;
}

interface NewProjectWizardProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

type NewProjectWizardInternalProps = NewProjectWizardProps &
  (NewProjectWizardModeNew | NewProjectWizardModeStudio);

export function NewProjectWizard(props: NewProjectWizardInternalProps) {
  const { open, onClose } = props;
  const isStudio = props.mode === 'studio';
  const router = useRouter();

  // In studio mode: step 1 = size (only step)
  // In new-project mode: step 1 = name, step 2 = size + cell size
  const [step, setStep] = useState<1 | 2>(isStudio ? 1 : 1);
  const maxStep = isStudio ? 1 : 2;
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Size + cell size
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
        if (isStudio) {
          props.onDismiss();
        } else {
          onClose();
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, isStudio, props]);

  const sizePreset = useMemo(() => {
    const found = QUILT_SIZE_PRESETS.find((p) => p.label === sizePresetLabel);
    return found ?? null;
  }, [sizePresetLabel]);

  const isCustom = sizePresetLabel === 'Custom';

  const canSubmit = useMemo(() => {
    if (isCreating) return false;
    if (!isStudio && !name.trim()) return false;
    if (isCustom) {
      const w = parseFloat(customWidth);
      const h = parseFloat(customHeight);
      return !isNaN(w) && !isNaN(h) && w > 0 && h > 0;
    }
    return true;
  }, [isCreating, isStudio, name, isCustom, customWidth, customHeight]);

  // Resolve dimensions (shared by both modes)
  const getDimensions = useCallback(() => {
    let canvasWidth = 48;
    let canvasHeight = 48;
    if (isCustom) {
      canvasWidth = parseFloat(customWidth);
      canvasHeight = parseFloat(customHeight);
    } else if (sizePreset) {
      canvasWidth = sizePreset.width;
      canvasHeight = sizePreset.height;
    }
    return { canvasWidth, canvasHeight };
  }, [isCustom, customWidth, customHeight, sizePreset]);

  // Studio mode: call onConfirm callback
  const handleStudioSubmit = useCallback(() => {
    if (!canSubmit || !isStudio) return;
    const { canvasWidth, canvasHeight } = getDimensions();
    props.onConfirm({ width: canvasWidth, height: canvasHeight });
  }, [canSubmit, isStudio, getDimensions, props]);

  // New-project mode: API create + navigate
  const handleCreate = useCallback(async () => {
    if (canSubmit && isStudio) {
      handleStudioSubmit();
      return;
    }
    if (!canSubmit) return;
    setError(null);
    setIsCreating(true);

    const { canvasWidth, canvasHeight } = getDimensions();

    const payload: Record<string, unknown> = {
      name: name.trim(),
      unitSystem: 'imperial' as const,
      canvasWidth,
      canvasHeight,
      gridSettings: { enabled: true, size: cellSize, snapToGrid: true },
    };

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

      // The wizard already collects all necessary info.
      // Suppress the studio setup modal to avoid redundancy.
      sessionStorage.setItem(`qc-quilt-setup-shown-${newId}`, '1');

      onClose();
      router.push(`/studio/${newId}`);
    } catch {
      setError('Failed to create project');
      setIsCreating(false);
    }
  }, [canSubmit, isStudio, handleStudioSubmit, getDimensions, name, cellSize, onClose, router]);

  const handleClose = isStudio ? props.onDismiss : onClose;
  const handleDismiss = isStudio ? props.onDismiss : onClose;

  if (!open) return null;

  // ─── Step ordering ───
  // studio: step 1 = size (only step)
  // new-project: step 1 = name, step 2 = size + cell size
  const showNameStep = !isStudio && step === 1;
  const showSizeStep = isStudio ? step === 1 : step === 2;

  const stepTitle = isStudio
    ? 'New Quilt'
    : 'New Project';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-wizard-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`w-full max-h-[90vh] overflow-y-auto rounded-full bg-neutral shadow-elevation-2 focus:outline-none ${isStudio ? 'max-w-lg' : 'max-w-2xl'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/30">
          <h2 id="new-project-wizard-title" className="text-xl font-extrabold text-neutral-800 tracking-tight">
            {stepTitle}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-800 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-container transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-full bg-error/10 border border-error/20 px-4 py-2 text-sm text-error">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-6 min-h-[300px] flex flex-col">
          {/* ─── Name step (new-project only) ─── */}
          {showNameStep && (
            <div className="space-y-6 flex-1">
              <div>
                <label
                  htmlFor="wizard-name"
                  className="block text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-3"
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
                  className="w-full rounded-full border border-neutral-200 bg-neutral px-4 py-3 text-lg text-neutral-800 focus:border-black focus:outline-none shadow-elevation-1"
                  autoFocus
                />
              </div>
              <div className="flex justify-end pt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  className="rounded-full bg-primary px-6 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-white transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* ─── Size step ─── */}
          {showSizeStep && (
            <div className="space-y-6 flex-1 flex flex-col">
              <label className="block text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                Quilt Size
              </label>
              <div className={`grid ${isStudio ? 'grid-cols-2 gap-2 mb-4' : 'grid-cols-2 md:grid-cols-4 gap-3'}`}>
                {QUILT_SIZE_PRESETS.map((preset) => {
                  const isActive = sizePresetLabel === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSizePresetLabel(preset.label)}
                      className={
                        isActive
                          ? 'flex flex-col items-center justify-center rounded-full p-3 bg-primary text-white shadow'
                          : 'flex flex-col items-center justify-center rounded-full p-3 bg-neutral-container text-neutral-800 hover:bg-neutral-container-high transition-colors'
                      }
                    >
                      <span className="text-sm font-bold mb-1 tracking-tight">{preset.label}</span>
                      <span className={isActive ? 'text-xs font-mono text-white/80' : 'text-xs font-mono text-neutral-500'}>
                        {preset.width}″ × {preset.height}″
                      </span>
                    </button>
                  );
                })}
                {!isStudio && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSizePresetLabel('Custom')}
                      className={
                        isCustom
                          ? 'w-full rounded-full px-4 py-3 bg-primary text-white text-sm font-bold shadow'
                          : 'w-full rounded-full px-4 py-3 bg-neutral-container text-neutral-800 text-sm font-bold hover:bg-neutral-container-high transition-colors border border-neutral-200/30'
                      }
                    >
                      Custom Size
                    </button>
                  </div>
                )}
              </div>

              {/* Custom size in studio mode is inline */}
              {isStudio && (
                <button
                  type="button"
                  onClick={() => setSizePresetLabel('Custom')}
                  className={`col-span-2 flex items-center justify-center rounded-full px-3 py-2.5 transition-colors ${isCustom
                    ? 'bg-primary text-white shadow'
                    : 'bg-neutral-container text-neutral-800 hover:bg-neutral-container-high'
                    }`}
                >
                  <span className="text-sm font-medium">Custom Size</span>
                </button>
              )}

              {isCustom && (
                <div className={`grid grid-cols-2 gap-4 mt-2 p-4 bg-neutral-container rounded-full`}>
                  <div>
                    <label htmlFor="wizard-w" className="block text-xs font-medium text-neutral-500 mb-1">
                      Width (inches)
                    </label>
                    <input
                      id="wizard-w"
                      type="number"
                      min={1}
                      max={isStudio ? 144 : 200}
                      step={0.5}
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="w-full rounded-full border border-neutral-200 bg-neutral px-3 py-2 text-sm focus:border-black focus:outline-none"
                      placeholder="e.g. 60"
                    />
                  </div>
                  <div>
                    <label htmlFor="wizard-h" className="block text-xs font-medium text-neutral-500 mb-1">
                      Height (inches)
                    </label>
                    <input
                      id="wizard-h"
                      type="number"
                      min={1}
                      max={isStudio ? 144 : 200}
                      step={0.5}
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-full rounded-full border border-neutral-200 bg-neutral px-3 py-2 text-sm focus:border-black focus:outline-none"
                      placeholder="e.g. 72"
                    />
                  </div>
                </div>
              )}

              {/* Cell size — new-project mode only */}
              {!isStudio && (
                <div>
                  <label className="block text-sm font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                    Grid Cell Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CELL_SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCellSize(size)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${Math.abs(cellSize - size) < 0.001
                          ? 'bg-primary text-white shadow'
                          : 'bg-neutral-container text-neutral-500 hover:bg-neutral-container-high'
                          }`}
                      >
                        {fmtCellSize(size)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-neutral-500 mt-2">
                    The reference grid spacing for your layout. Each cell = {fmtCellSize(cellSize)}.
                  </p>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-end gap-3 mt-6">
                {isStudio && (
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="bg-neutral px-4 py-2 text-sm font-medium text-neutral-500 rounded-full"
                  >
                    Skip
                  </button>
                )}
                {isStudio ? (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isCustom && (!customWidth || !customHeight)}
                    className="rounded-full bg-primary px-6 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-white hover:opacity-90 transition-all disabled:opacity-50 shadow"
                  >
                    Create Quilt
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={isCustom && (!customWidth || !customHeight)}
                    className="rounded-full bg-primary px-6 py-2.5 text-[11px] font-semibold tracking-wide uppercase text-white hover:opacity-90 transition-all disabled:opacity-50 shadow"
                  >
                    Next Step
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
