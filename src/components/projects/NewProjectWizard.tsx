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

  const [step, setStep] = useState<1 | 2>(isStudio ? 1 : 1);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [sizePresetLabel, setSizePresetLabel] = useState<string>('Throw');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [cellSize, setCellSize] = useState(1);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

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

  const handleStudioSubmit = useCallback(() => {
    if (!canSubmit || !isStudio) return;
    const { canvasWidth, canvasHeight } = getDimensions();
    props.onConfirm({ width: canvasWidth, height: canvasHeight });
  }, [canSubmit, isStudio, getDimensions, props]);

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

  const showNameStep = !isStudio && step === 1;
  const showSizeStep = isStudio ? step === 1 : step === 2;

  const stepTitle = isStudio ? 'New Quilt' : 'New Project';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-wizard-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`w-full max-h-[90vh] overflow-y-auto bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[0_1px_2px_rgba(45,42,38,0.08)] focus:outline-none rounded-lg ${isStudio ? 'max-w-lg' : 'max-w-2xl'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <h2
            id="new-project-wizard-title"
            className="text-[24px] leading-[32px] font-semibold text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {stepTitle}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] w-8 h-8 flex items-center justify-center hover:bg-[var(--color-bg)] transition-colors duration-150 rounded-full"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M3 3L11 11M11 3L3 11"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 bg-[#ffc7c7]/30 border border-[#ffc7c7] px-4 py-2 text-sm text-[var(--color-text)] rounded-lg">
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
                  className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-3"
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
                  className="w-full border border-[var(--color-border)] px-4 py-3 text-[18px] leading-[28px] text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] focus:outline-2 focus:outline-[#ff8d49] rounded-lg"
                  autoFocus
                />
              </div>
              <div className="flex justify-end pt-8">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!name.trim()}
                  className="bg-[#ff8d49] text-[var(--color-text)] px-6 py-2 text-[14px] leading-[20px] font-medium hover:bg-[#e67d3f] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {/* ─── Size step ─── */}
          {showSizeStep && (
            <div className="space-y-6 flex-1 flex flex-col">
              <label className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-2">
                Quilt Size
              </label>
              <div
                className={`grid ${isStudio ? 'grid-cols-2 gap-2 mb-4' : 'grid-cols-2 md:grid-cols-4 gap-3'}`}
              >
                {QUILT_SIZE_PRESETS.map((preset) => {
                  const isActive = sizePresetLabel === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setSizePresetLabel(preset.label)}
                      className={
                        isActive
                          ? 'flex flex-col items-center justify-center p-3 bg-[#ff8d49] text-[var(--color-text)] shadow-[0_1px_2px_rgba(45,42,38,0.08)] rounded-full'
                          : 'flex flex-col items-center justify-center p-3 bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[#ffc8a6]/20 transition-colors duration-150 rounded-full'
                      }
                    >
                      <span className="text-[16px] leading-[24px] font-medium mb-1">
                        {preset.label}
                      </span>
                      <span
                        className={
                          isActive
                            ? 'text-[14px] leading-[20px] font-mono text-[var(--color-text)]/70'
                            : 'text-[14px] leading-[20px] font-mono text-[var(--color-text-dim)]'
                        }
                      >
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
                          ? 'w-full px-4 py-3 bg-[#ff8d49] text-[var(--color-text)] text-[16px] leading-[24px] font-medium shadow-[0_1px_2px_rgba(45,42,38,0.08)] rounded-full'
                          : 'w-full px-4 py-3 bg-[var(--color-bg)] text-[var(--color-text)] text-[16px] leading-[24px] font-medium hover:bg-[#ffc8a6]/20 transition-colors duration-150 border border-[var(--color-border)] rounded-full'
                      }
                    >
                      Custom Size
                    </button>
                  </div>
                )}
              </div>

              {isStudio && (
                <button
                  type="button"
                  onClick={() => setSizePresetLabel('Custom')}
                  className={`flex items-center justify-center px-3 py-2.5 transition-colors duration-150 rounded-full ${
                    isCustom
                      ? 'bg-[#ff8d49] text-[var(--color-text)] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                      : 'bg-[var(--color-bg)] text-[var(--color-text)] hover:bg-[#ffc8a6]/20'
                  }`}
                >
                  <span className="text-[16px] leading-[24px] font-medium">Custom Size</span>
                </button>
              )}

              {isCustom && (
                <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg">
                  <div>
                    <label
                      htmlFor="wizard-w"
                      className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-1"
                    >
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
                      className="w-full border border-[var(--color-border)] px-3 py-2 text-[16px] leading-[24px] text-[var(--color-text)] focus:outline-2 focus:outline-[#ff8d49] rounded-lg"
                      placeholder="e.g. 60"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="wizard-h"
                      className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-1"
                    >
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
                      className="w-full border border-[var(--color-border)] px-3 py-2 text-[16px] leading-[24px] text-[var(--color-text)] focus:outline-2 focus:outline-[#ff8d49] rounded-lg"
                      placeholder="e.g. 72"
                    />
                  </div>
                </div>
              )}

              {/* Cell size — new-project mode only */}
              {!isStudio && (
                <div>
                  <label className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-2">
                    Grid Cell Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {CELL_SIZE_OPTIONS.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setCellSize(size)}
                        className={`px-4 py-2 text-[16px] leading-[24px] font-medium transition-colors duration-150 rounded-full ${
                          Math.abs(cellSize - size) < 0.001
                            ? 'bg-[#ff8d49] text-[var(--color-text)] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                            : 'bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:bg-[#ffc8a6]/20'
                        }`}
                      >
                        {fmtCellSize(size)}
                      </button>
                    ))}
                  </div>
                  <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)] mt-2">
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
                    className="bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-2 text-[16px] leading-[24px] font-medium text-[var(--color-text-dim)] hover:bg-[#ffc8a6]/20 transition-colors duration-150 rounded-full"
                  >
                    Skip
                  </button>
                )}
                {isStudio ? (
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={isCustom && (!customWidth || !customHeight)}
                    className="bg-[#ff8d49] text-[var(--color-text)] px-6 py-2 text-[14px] leading-[20px] font-medium hover:bg-[#e67d3f] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
                  >
                    Create Quilt
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={isCustom && (!customWidth || !customHeight)}
                    className="bg-[#ff8d49] text-[var(--color-text)] px-6 py-2 text-[14px] leading-[20px] font-medium hover:bg-[#e67d3f] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
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
