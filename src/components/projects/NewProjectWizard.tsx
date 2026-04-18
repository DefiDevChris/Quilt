'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUILT_SIZE_PRESETS } from '@/lib/constants';
import { LAYOUT_TYPE_CARDS } from '@/lib/layout-type-cards';
import { getLayoutPreset, PRESET_SVG } from '@/lib/layout-library';
import { computeLayoutSize } from '@/lib/layout-size-utils';
import type { BorderConfig, LayoutType, SashingConfig } from '@/lib/layout-utils';

const CELL_SIZE_OPTIONS = [0.25, 0.5, 1, 2, 3] as const;
const DEFAULT_STUDIO_LAYOUT_ID = LAYOUT_TYPE_CARDS[0]?.id ?? 'grid';

const PROJECT_MODE_CARDS = [
  {
    id: 'free-form',
    name: 'Free-form',
    icon: '📏', // ruler icon
    description: 'Start with blank canvas and draw or place blocks anywhere.',
  },
  {
    id: 'layout',
    name: 'Layout',
    icon: '📐', // grid icon
    description: 'Start with a grid or shape layout, then fill in.',
  },
  {
    id: 'template',
    name: 'Template',
    icon: '🎨', // palette icon
    description: 'Start with a fully designed quilt and tweak it.',
  },
] as const;

function fmtCellSize(inches: number): string {
  if (inches === 0.25) return '¼"';
  if (inches === 0.5) return '½"';
  return `${inches}"`;
}

function createBorderId(): string {
  return typeof crypto !== 'undefined' ? crypto.randomUUID() : `border-${Date.now()}`;
}

function cloneBorders(borders: BorderConfig[] | undefined): BorderConfig[] {
  return (borders ?? []).map((border) => ({
    id: border.id ?? createBorderId(),
    width: border.width,
    color: border.color,
    fabricId: border.fabricId ?? null,
    type: border.type ?? 'solid',
  }));
}

function cloneSashing(sashing: SashingConfig | undefined): SashingConfig {
  return {
    width: sashing?.width ?? 0,
    color: sashing?.color ?? '#e5d5c5',
    fabricId: sashing?.fabricId ?? null,
  };
}

export interface StudioQuiltSetup {
  width: number;
  height: number;
  presetId: string;
  layoutType: LayoutType;
  rows: number;
  cols: number;
  blockSize: number;
  sashing: SashingConfig;
  borders: BorderConfig[];
  hasCornerstones: boolean;
  bindingWidth: number;
}

interface NewProjectWizardModeNew {
  mode?: 'new-project';
}

interface NewProjectWizardModeStudio {
  mode: 'studio';
  projectId: string;
  onConfirm: (args: { setup: StudioQuiltSetup }) => void;
  onDismiss: () => void;
  allowDismiss?: boolean;
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
  const allowStudioDismiss = !isStudio || props.allowDismiss !== false;
  const router = useRouter();

  const [step, setStep] = useState<0 | 1 | 2>(props.mode === 'new-project' ? 0 : 1);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedProjectMode, setSelectedProjectMode] = useState<
    'free-form' | 'layout' | 'template' | null
  >(null);

  const [sizePresetLabel, setSizePresetLabel] = useState<string>('Throw');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  const [studioLayoutId, setStudioLayoutId] = useState(DEFAULT_STUDIO_LAYOUT_ID);
  const [studioRows, setStudioRows] = useState(4);
  const [studioCols, setStudioCols] = useState(4);
  const [studioBlockSize, setStudioBlockSize] = useState(12);
  const [studioSashing, setStudioSashing] = useState<SashingConfig>({
    width: 0,
    color: '#e5d5c5',
    fabricId: null,
  });
  const [studioBorders, setStudioBorders] = useState<BorderConfig[]>([]);
  const [studioHasCornerstones, setStudioHasCornerstones] = useState(false);
  const [studioBindingWidth, setStudioBindingWidth] = useState(0.25);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  const studioCard = useMemo(
    () => LAYOUT_TYPE_CARDS.find((card) => card.id === studioLayoutId) ?? LAYOUT_TYPE_CARDS[0],
    [studioLayoutId]
  );

  const studioPreset = useMemo(() => {
    if (!studioCard) return null;
    return getLayoutPreset(studioCard.defaultPresetId) ?? null;
  }, [studioCard]);

  useEffect(() => {
    if (!open) return;
    return () => {
      setStep(props.mode === 'new-project' ? 0 : 1);
      setError(null);
      setIsCreating(false);
      setSelectedProjectMode(null);
      setSizePresetLabel('Throw');
      setCustomWidth('');
      setCustomHeight('');
      setStudioLayoutId(DEFAULT_STUDIO_LAYOUT_ID);
      const defaultStudioCard =
        LAYOUT_TYPE_CARDS.find((card) => card.id === DEFAULT_STUDIO_LAYOUT_ID) ??
        LAYOUT_TYPE_CARDS[0];
      const defaultStudioPreset = defaultStudioCard
        ? (getLayoutPreset(defaultStudioCard.defaultPresetId) ?? null)
        : null;
      if (defaultStudioPreset) {
        setStudioRows(defaultStudioPreset.config.rows);
        setStudioCols(defaultStudioPreset.config.cols);
        setStudioBlockSize(defaultStudioPreset.config.blockSize);
        setStudioSashing(cloneSashing(defaultStudioPreset.config.sashing));
        setStudioBorders(cloneBorders(defaultStudioPreset.config.borders));
        setStudioHasCornerstones(defaultStudioCard?.hasCornerstones ?? false);
        setStudioBindingWidth(defaultStudioCard?.hasBinding ? 0.25 : 0);
      }
    };
  }, [open]);

  const applyStudioLayoutDefaults = useCallback((layoutId: string) => {
    setStudioLayoutId(layoutId);
    const nextCard = LAYOUT_TYPE_CARDS.find((card) => card.id === layoutId) ?? LAYOUT_TYPE_CARDS[0];
    const nextPreset = nextCard ? (getLayoutPreset(nextCard.defaultPresetId) ?? null) : null;
    if (!nextPreset) return;

    setStudioRows(nextPreset.config.rows);
    setStudioCols(nextPreset.config.cols);
    setStudioBlockSize(nextPreset.config.blockSize);
    setStudioSashing(cloneSashing(nextPreset.config.sashing));
    setStudioBorders(cloneBorders(nextPreset.config.borders));
    setStudioHasCornerstones(nextCard?.hasCornerstones ?? false);
    setStudioBindingWidth(nextCard?.hasBinding ? 0.25 : 0);
    // Auto-advance to the size/config step so picking a layout feels like the
    // reference PictureMyBlocks flow — one decision per screen, no extra clicks.
    setStep(2);
  }, []);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      if (previouslyFocused.current instanceof HTMLElement) {
        previouslyFocused.current.focus();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      if (isStudio) {
        if (allowStudioDismiss) {
          props.onDismiss();
        }
        return;
      }
      onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, isStudio, allowStudioDismiss, props]);

  const sizePreset = useMemo(() => {
    const found = QUILT_SIZE_PRESETS.find((preset) => preset.label === sizePresetLabel);
    return found ?? null;
  }, [sizePresetLabel]);

  const isCustom = sizePresetLabel === 'Custom';
  const isFreeForm = studioCard?.id === 'free-form';

  const canSubmit = useMemo(() => {
    if (isCreating) return false;
    if (props.mode === 'new-project') {
      if (step === 0) return true;
      if (step === 1 && selectedProjectMode === 'free-form') {
        if (isCustom) {
          const w = parseFloat(customWidth);
          const h = parseFloat(customHeight);
          return !Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0;
        }
        return true;
      }
      return false;
    }
    if (step === 1) return !!studioCard;
    if (!isFreeForm) return true;
    if (isCustom) {
      const w = parseFloat(customWidth);
      const h = parseFloat(customHeight);
      return !Number.isNaN(w) && !Number.isNaN(h) && w > 0 && h > 0;
    }
    return true;
  }, [
    isCreating,
    step,
    selectedProjectMode,
    props.mode,
    studioCard,
    isFreeForm,
    isCustom,
    customWidth,
    customHeight,
  ]);

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

  const studioFinishedSize = useMemo(() => {
    if (!studioCard || studioCard.id === 'free-form') return null;
    return computeLayoutSize({
      type: studioPreset?.config.type ?? 'grid',
      rows: studioRows,
      cols: studioCols,
      blockSize: studioBlockSize,
      sashingWidth: studioSashing.width,
      borders: studioBorders,
      bindingWidth: studioBindingWidth,
    });
  }, [
    studioCard,
    studioPreset,
    studioRows,
    studioCols,
    studioBlockSize,
    studioSashing.width,
    studioBorders,
    studioBindingWidth,
  ]);

  const handleStudioSubmit = useCallback(() => {
    if (!studioCard || !studioPreset) return;
    if (props.mode !== 'studio') return;

    if (studioCard.id === 'free-form') {
      const { canvasWidth, canvasHeight } = getDimensions();
      props.onConfirm({
        setup: {
          width: canvasWidth,
          height: canvasHeight,
          presetId: studioCard.defaultPresetId,
          layoutType: 'free-form',
          rows: 1,
          cols: 1,
          blockSize: 12,
          sashing: { width: 0, color: '#e5d5c5', fabricId: null },
          borders: [],
          hasCornerstones: false,
          bindingWidth: 0,
        },
      });
      return;
    }

    const finished =
      studioFinishedSize ??
      computeLayoutSize({
        type: studioPreset.config.type,
        rows: studioRows,
        cols: studioCols,
        blockSize: studioBlockSize,
        sashingWidth: studioSashing.width,
        borders: studioBorders,
        bindingWidth: studioBindingWidth,
      });

    props.onConfirm({
      setup: {
        width: finished.width,
        height: finished.height,
        presetId: studioPreset.id,
        layoutType: studioPreset.config.type,
        rows: studioRows,
        cols: studioCols,
        blockSize: studioBlockSize,
        sashing: studioSashing,
        borders: studioBorders,
        hasCornerstones: studioHasCornerstones,
        bindingWidth: studioBindingWidth,
      },
    });
  }, [
    studioCard,
    studioPreset,
    getDimensions,
    props,
    studioFinishedSize,
    studioRows,
    studioCols,
    studioBlockSize,
    studioSashing,
    studioBorders,
    studioHasCornerstones,
    studioBindingWidth,
  ]);

  const handleImmediateCreate = useCallback(
    async (mode: 'layout' | 'template') => {
      if (!canSubmit) return;
      setError(null);
      setIsCreating(true);

      const payload: Record<string, unknown> = {
        name: 'Untitled Quilt',
        mode,
        unitSystem: 'imperial' as const,
        canvasWidth: 48,
        canvasHeight: 48,
        gridSettings: { enabled: true, size: 1, snapToGrid: true },
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
          } catch {}
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

        onClose();
        router.push(`/studio/${newId}?from=${mode === 'layout' ? 'layouts' : 'templates'}`);
      } catch {
        setError('Failed to create project');
        setIsCreating(false);
      }
    },
    [canSubmit, onClose, router]
  );

  const handleProjectModeSelect = useCallback(
    (mode: 'free-form' | 'layout' | 'template') => {
      if (mode === 'free-form') {
        setSelectedProjectMode('free-form');
        setStep(1);
      } else {
        handleImmediateCreate(mode);
      }
    },
    [handleImmediateCreate]
  );

  const handleCreate = useCallback(async () => {
    if (isStudio) {
      if (!canSubmit) return;
      handleStudioSubmit();
      return;
    }

    if (props.mode === 'new-project') {
      if (!canSubmit) return;
      setError(null);
      setIsCreating(true);

      const { canvasWidth, canvasHeight } = getDimensions();

      const payload: Record<string, unknown> = {
        name: 'Untitled Quilt',
        mode: selectedProjectMode,
        unitSystem: 'imperial' as const,
        canvasWidth,
        canvasHeight,
        gridSettings: { enabled: true, size: 1, snapToGrid: true },
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
          } catch {}
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

        onClose();
        router.push(`/studio/${newId}`);
      } catch {
        setError('Failed to create project');
        setIsCreating(false);
      }
      return;
    }

    if (!canSubmit) return;
    setError(null);
    setIsCreating(true);

    const { canvasWidth, canvasHeight } = getDimensions();

    let canvasDataPayload = undefined;
    let finalWidth = canvasWidth;
    let finalHeight = canvasHeight;

    if (studioCard && studioPreset && studioCard.id !== 'free-form') {
      const finished =
        studioFinishedSize ??
        computeLayoutSize({
          type: studioPreset.config.type,
          rows: studioRows,
          cols: studioCols,
          blockSize: studioBlockSize,
          sashingWidth: studioSashing.width,
          borders: studioBorders,
          bindingWidth: studioBindingWidth,
        });

      finalWidth = finished.width;
      finalHeight = finished.height;

      canvasDataPayload = {
        __layoutState: {
          layoutType: studioPreset.config.type,
          selectedPresetId: studioPreset.id,
          rows: studioRows,
          cols: studioCols,
          blockSize: studioBlockSize,
          sashing: studioSashing,
          borders: studioBorders,
          hasCornerstones: studioHasCornerstones,
          bindingWidth: studioBindingWidth,
          hasAppliedLayout: true,
        },
      };
    } else if (studioCard?.id === 'free-form') {
      canvasDataPayload = {
        __layoutState: {
          layoutType: 'free-form',
          selectedPresetId: 'free-form',
          rows: 1,
          cols: 1,
          blockSize: 12,
          sashing: { width: 0, color: '#e5d5c5', fabricId: null },
          borders: [],
          hasCornerstones: false,
          bindingWidth: 0,
          hasAppliedLayout: true,
        },
      };
    }

    const payload: Record<string, unknown> = {
      name: 'Untitled Quilt',
      unitSystem: 'imperial' as const,
      canvasWidth: finalWidth,
      canvasHeight: finalHeight,
      gridSettings: { enabled: true, size: 1, snapToGrid: true },
      ...(canvasDataPayload ? { canvasData: canvasDataPayload } : {}),
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
        } catch {}
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

      onClose();
      router.push(`/studio/${newId}`);
    } catch {
      setError('Failed to create project');
      setIsCreating(false);
    }
  }, [
    canSubmit,
    isStudio,
    handleStudioSubmit,
    getDimensions,
    onClose,
    router,
    studioCard,
    studioPreset,
    studioFinishedSize,
    studioRows,
    studioCols,
    studioBlockSize,
    studioSashing,
    studioBorders,
    studioHasCornerstones,
    studioBindingWidth,
  ]);

  const handleClose = isStudio ? (allowStudioDismiss ? props.onDismiss : () => {}) : onClose;
  const handleDismiss = isStudio ? props.onDismiss : onClose;

  const showProjectModeStep = props.mode === 'new-project' && step === 0;
  const showStudioLayoutStep =
    (props.mode !== 'new-project' && step === 1) ||
    (props.mode === 'new-project' && step === 1 && selectedProjectMode === 'free-form');
  const showConfigStep = step === 2;
  const stepTitle =
    props.mode === 'new-project'
      ? step === 0
        ? 'Choose your project type'
        : 'Choose your quilt size'
      : step === 1
        ? 'Choose your layout'
        : studioCard?.id === 'free-form'
          ? 'Choose your quilt size'
          : 'Set your quilt size';
  const stepSubtitle =
    props.mode === 'new-project'
      ? step === 0
        ? 'Pick the starting point for your quilt design.'
        : 'Create an open canvas that snaps to the grid for free-form drawing and block placement.'
      : step === 1
        ? 'Pick the quilt structure before the canvas is created.'
        : studioCard?.id === 'free-form'
          ? 'Create an open canvas that snaps to the grid for free-form drawing and block placement.'
          : 'Adjust the block grid, sashing, and borders before opening the studio canvas.';

  if (!open) return null;

  // ── Unified full-screen linear flow ──────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-project-wizard-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="flex-1 flex flex-col overflow-y-auto focus:outline-none relative"
      >
        {/* Top navigation */}
        <div className="relative w-full max-w-4xl mx-auto px-6 h-28 flex items-center justify-center">
          {(step === 2 || (props.mode === 'new-project' && step === 1)) && (
            <button
              type="button"
              onClick={() => {
                if (props.mode === 'new-project' && step === 1) {
                  setStep(0);
                  setSelectedProjectMode(null);
                } else {
                  setStep(1);
                }
              }}
              className="absolute left-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors duration-150"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path
                  d="M11 4L6 9L11 14"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {props.mode === 'new-project' && step === 1 ? 'Change project type' : 'Change layout'}
            </button>
          )}

          <div className="flex flex-col items-center">
            <h2
              id="new-project-wizard-title"
              className="text-4xl font-bold text-[var(--color-text)] text-center"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {stepTitle}
            </h2>
            {stepSubtitle && (
              <p className="mt-2 text-[15px] leading-[22px] text-[var(--color-text-dim)] text-center max-w-lg mx-auto">
                {stepSubtitle}
              </p>
            )}
          </div>

          {step === 1 && (!isStudio || allowStudioDismiss) && (
            <button
              type="button"
              onClick={handleClose}
              className="absolute right-6 w-10 h-10 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors duration-150"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 3L11 11M11 3L3 11"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <div className="max-w-4xl mx-auto w-full px-6 mt-2 mb-4">
            <div className="bg-[#ffc7c7]/30 border border-[#ffc7c7] px-4 py-2 text-sm text-[var(--color-text)] rounded-lg">
              {error}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="w-full max-w-4xl mx-auto px-6 pb-12 flex-1 flex flex-col">
          {showProjectModeStep && (
            <div className="space-y-8 flex-1">
              <div className="grid gap-5 md:grid-cols-3">
                {PROJECT_MODE_CARDS.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => handleProjectModeSelect(card.id)}
                    aria-pressed={false}
                    className="flex flex-col items-center gap-4 rounded-xl border-2 bg-[var(--color-surface)] p-8 text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg border-[var(--color-border)] hover:border-[var(--color-primary)]/40"
                  >
                    <div className="w-16 h-16 rounded-xl border border-[var(--color-border)]/20 bg-[var(--color-bg)] flex items-center justify-center overflow-hidden p-3">
                      <span className="text-3xl">{card.icon}</span>
                    </div>
                    <div className="flex flex-col items-center gap-1.5">
                      <h3 className="text-xl font-semibold text-[var(--color-text)]">
                        {card.name}
                      </h3>
                      <p className="text-sm text-[var(--color-text-dim)]">{card.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showStudioLayoutStep && (
            <div className="space-y-8 flex-1">
              {props.mode === 'new-project' && selectedProjectMode === 'free-form' ? (
                <>
                  <label className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-2">
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
                              ? 'flex flex-col items-center justify-center p-3 bg-primary text-[var(--color-text)] shadow-brand rounded-full'
                              : 'flex flex-col items-center justify-center p-3 bg-default text-[var(--color-text)] hover:bg-[#f5c4b0]/20 transition-colors duration-150 rounded-full'
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
                  </div>

                  <button
                    type="button"
                    onClick={() => setSizePresetLabel('Custom')}
                    className={`flex items-center justify-center px-3 py-2.5 transition-colors duration-150 rounded-full ${
                      isCustom
                        ? 'bg-primary text-[var(--color-text)] shadow-brand'
                        : 'bg-default text-[var(--color-text)] hover:bg-[#f5c4b0]/20'
                    }`}
                  >
                    <span className="text-[16px] leading-[24px] font-medium">Custom Size</span>
                  </button>

                  {isCustom && (
                    <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-default border border-[var(--color-border)] rounded-lg">
                      <div>
                        <label
                          htmlFor="studio-freeform-w"
                          className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-1"
                        >
                          Width (inches)
                        </label>
                        <input
                          id="studio-freeform-w"
                          type="number"
                          min={1}
                          max={144}
                          step={0.5}
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          className="w-full border border-[var(--color-border)] px-3 py-2 text-[16px] leading-[24px] text-[var(--color-text)] focus:outline-2 focus:outline-primary rounded-lg"
                          placeholder="e.g. 60"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="studio-freeform-h"
                          className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-1"
                        >
                          Height (inches)
                        </label>
                        <input
                          id="studio-freeform-h"
                          type="number"
                          min={1}
                          max={144}
                          step={0.5}
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          className="w-full border border-[var(--color-border)] px-3 py-2 text-[16px] leading-[24px] text-[var(--color-text)] focus:outline-2 focus:outline-primary rounded-lg"
                          placeholder="e.g. 72"
                        />
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-bg)] px-4 py-3">
                    <div className="flex items-center justify-between text-[14px]">
                      <span className="text-[var(--color-text-dim)]">Canvas mode</span>
                      <span className="font-medium text-[var(--color-text)]">Free-form</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-[20px] text-[var(--color-text-dim)]">
                      Blocks can drop anywhere on the quilt grid and shapes stay aligned with
                      snap-to-grid.
                    </p>
                  </div>

                  <div className="flex justify-center gap-3 mt-6 pb-4">
                    <button
                      type="button"
                      onClick={handleCreate}
                      disabled={!canSubmit}
                      className="bg-primary text-[var(--color-text)] px-10 py-3 text-[16px] leading-[24px] font-semibold hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:-translate-y-0.5 active:translate-y-0"
                      style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                    >
                      {isCreating ? 'Creating...' : 'Open Studio'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {LAYOUT_TYPE_CARDS.map((card) => {
                    const svgContent = PRESET_SVG[card.defaultPresetId] ?? '';
                    const isActive = studioLayoutId === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => applyStudioLayoutDefaults(card.id)}
                        aria-pressed={isActive}
                        className={`flex flex-col items-center gap-4 rounded-xl border-2 bg-[var(--color-surface)] p-8 text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                          isActive
                            ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25 shadow-lg'
                            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
                        }`}
                      >
                        <div className="w-28 h-28 rounded-xl border border-[var(--color-border)]/20 bg-[var(--color-bg)] flex items-center justify-center overflow-hidden p-3">
                          {svgContent ? (
                            <div
                              className="w-full h-full"
                              dangerouslySetInnerHTML={{ __html: svgContent }}
                            />
                          ) : (
                            <span className="text-4xl">{card.icon}</span>
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                          <h3 className="text-xl font-semibold text-[var(--color-text)]">
                            {card.name}
                          </h3>
                          <p className="text-sm text-[var(--color-text-dim)]">{card.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {showConfigStep && studioCard && (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="rounded-xl border border-[var(--color-border)]/20 bg-[var(--color-surface)] px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex-shrink-0 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]/15 flex items-center justify-center overflow-hidden p-1">
                    {PRESET_SVG[studioCard.defaultPresetId] ? (
                      <div
                        className="w-full h-full"
                        dangerouslySetInnerHTML={{ __html: PRESET_SVG[studioCard.defaultPresetId] }}
                      />
                    ) : (
                      <span className="text-xl">{studioCard.icon}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[12px] leading-[18px] font-medium text-[var(--color-text-dim)] uppercase tracking-[0.08em]">
                      Selected layout
                    </p>
                    <h3 className="mt-0.5 text-[18px] leading-[28px] font-semibold text-[var(--color-text)]">
                      {studioCard.name}
                    </h3>
                  </div>
                </div>
              </div>

              {studioCard.id === 'free-form' ? (
                <>
                  <label className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-2">
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
                              ? 'flex flex-col items-center justify-center p-3 bg-primary text-[var(--color-text)] shadow-brand rounded-full'
                              : 'flex flex-col items-center justify-center p-3 bg-default text-[var(--color-text)] hover:bg-[#f5c4b0]/20 transition-colors duration-150 rounded-full'
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
                  </div>

                  <button
                    type="button"
                    onClick={() => setSizePresetLabel('Custom')}
                    className={`flex items-center justify-center px-3 py-2.5 transition-colors duration-150 rounded-full ${
                      isCustom
                        ? 'bg-primary text-[var(--color-text)] shadow-brand'
                        : 'bg-default text-[var(--color-text)] hover:bg-[#f5c4b0]/20'
                    }`}
                  >
                    <span className="text-[16px] leading-[24px] font-medium">Custom Size</span>
                  </button>

                  {isCustom && (
                    <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-default border border-[var(--color-border)] rounded-lg">
                      <div>
                        <label
                          htmlFor="studio-freeform-w"
                          className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-1"
                        >
                          Width (inches)
                        </label>
                        <input
                          id="studio-freeform-w"
                          type="number"
                          min={1}
                          max={144}
                          step={0.5}
                          value={customWidth}
                          onChange={(e) => setCustomWidth(e.target.value)}
                          className="w-full border border-[var(--color-border)] px-3 py-2 text-[16px] leading-[24px] text-[var(--color-text)] focus:outline-2 focus:outline-primary rounded-lg"
                          placeholder="e.g. 60"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="studio-freeform-h"
                          className="block text-[14px] leading-[20px] font-medium text-[var(--color-text-dim)] mb-1"
                        >
                          Height (inches)
                        </label>
                        <input
                          id="studio-freeform-h"
                          type="number"
                          min={1}
                          max={144}
                          step={0.5}
                          value={customHeight}
                          onChange={(e) => setCustomHeight(e.target.value)}
                          className="w-full border border-[var(--color-border)] px-3 py-2 text-[16px] leading-[24px] text-[var(--color-text)] focus:outline-2 focus:outline-primary rounded-lg"
                          placeholder="e.g. 72"
                        />
                      </div>
                    </div>
                  )}

                  <div className="rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-bg)] px-4 py-3">
                    <div className="flex items-center justify-between text-[14px]">
                      <span className="text-[var(--color-text-dim)]">Canvas mode</span>
                      <span className="font-medium text-[var(--color-text)]">Free-form</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-[20px] text-[var(--color-text-dim)]">
                      Blocks can drop anywhere on the quilt grid and shapes stay aligned with
                      snap-to-grid.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {studioCard.hasGridConfig && (
                    <div className="space-y-3 rounded-lg border border-[var(--color-border)]/20 p-4">
                      <WizardSliderRow
                        label="Rows"
                        value={studioRows}
                        min={1}
                        max={20}
                        step={1}
                        suffix={`${studioRows}`}
                        onChange={setStudioRows}
                      />
                      <WizardSliderRow
                        label="Columns"
                        value={studioCols}
                        min={1}
                        max={20}
                        step={1}
                        suffix={`${studioCols}`}
                        onChange={setStudioCols}
                      />
                      <WizardSliderRow
                        label="Block size"
                        value={studioBlockSize}
                        min={2}
                        max={24}
                        step={0.5}
                        suffix={`${studioBlockSize}″`}
                        onChange={setStudioBlockSize}
                      />
                    </div>
                  )}

                  {studioCard.hasSashing && (
                    <div className="rounded-lg border border-[var(--color-border)]/20 p-4">
                      <WizardSliderRow
                        label="Sashing"
                        value={studioSashing.width}
                        min={0.25}
                        max={6}
                        step={0.25}
                        suffix={`${studioSashing.width}″`}
                        onChange={(value) =>
                          setStudioSashing((current) => ({ ...current, width: value }))
                        }
                      />
                    </div>
                  )}

                  {studioCard.hasCornerstones && (
                    <div className="rounded-lg border border-[var(--color-border)]/20 p-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={studioHasCornerstones}
                          onChange={(e) => setStudioHasCornerstones(e.target.checked)}
                          className="rounded accent-[var(--color-primary)]"
                        />
                        <span className="text-[14px] leading-[20px] text-[var(--color-text)]">
                          Add cornerstones where sashing intersects
                        </span>
                      </label>
                    </div>
                  )}

                  {studioCard.hasBorders && (
                    <div className="rounded-lg border border-[var(--color-border)]/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] leading-[20px] font-medium text-[var(--color-text)]">
                          Borders
                        </span>
                        {studioBorders.length < 5 && (
                          <button
                            type="button"
                            onClick={() =>
                              setStudioBorders((current) => [
                                ...current,
                                {
                                  id: createBorderId(),
                                  width: 2,
                                  color: '#d4c4b5',
                                  fabricId: null,
                                  type: 'solid',
                                },
                              ])
                            }
                            className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1.5 text-[12px] font-medium text-[var(--color-primary)] transition-colors duration-150 hover:bg-[var(--color-primary)]/15"
                          >
                            Add border
                          </button>
                        )}
                      </div>
                      {studioBorders.length === 0 ? (
                        <p className="text-[13px] leading-[20px] text-[var(--color-text-dim)]">
                          No borders yet. Add one to grow the quilt around the current layout.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {studioBorders.map((border, index) => (
                            <div
                              key={border.id ?? index}
                              className="rounded-lg bg-[var(--color-bg)] px-3 py-3"
                            >
                              <div className="mb-2 flex items-center justify-between gap-3">
                                <span className="text-[13px] leading-[20px] font-medium text-[var(--color-text)]">
                                  Border {index + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setStudioBorders((current) =>
                                      current.filter((_, ci) => ci !== index)
                                    )
                                  }
                                  className="rounded-full border border-[var(--color-accent)]/20 px-3 py-1 text-[12px] font-medium text-[var(--color-accent)] transition-colors duration-150 hover:bg-[var(--color-accent)]/10"
                                >
                                  Remove
                                </button>
                              </div>
                              <WizardSliderRow
                                label="Width"
                                value={border.width}
                                min={0.5}
                                max={8}
                                step={0.5}
                                suffix={`${border.width}″`}
                                onChange={(value) =>
                                  setStudioBorders((current) =>
                                    current.map((cb, ci) =>
                                      ci === index ? { ...cb, width: value } : cb
                                    )
                                  )
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {studioCard.hasBinding && (
                    <div className="rounded-lg border border-[var(--color-border)]/20 p-4">
                      <WizardSliderRow
                        label="Binding"
                        value={studioBindingWidth}
                        min={0}
                        max={2}
                        step={0.125}
                        suffix={`${studioBindingWidth}″`}
                        onChange={setStudioBindingWidth}
                      />
                    </div>
                  )}

                  {studioFinishedSize && (
                    <div className="rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-bg)] px-4 py-4">
                      <div className="flex items-center justify-between text-[14px]">
                        <span className="text-[var(--color-text-dim)]">Finished quilt size</span>
                        <span className="font-semibold text-[var(--color-text)] font-mono">
                          {studioFinishedSize.width}″ × {studioFinishedSize.height}″
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[12px] text-[var(--color-text-dim)]">
                        <span>Perimeter: {studioFinishedSize.perimeter}″</span>
                        <span>Binding: {studioFinishedSize.bindingYardage} yd</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-center gap-3 mt-6 pb-4">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!canSubmit}
                  className="bg-primary text-[var(--color-text)] px-10 py-3 text-[16px] leading-[24px] font-semibold hover:bg-primary-dark transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:-translate-y-0.5 active:translate-y-0"
                  style={{ boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                >
                  {isStudio
                    ? isCreating
                      ? 'Applying...'
                      : 'Apply'
                    : isCreating
                      ? 'Creating...'
                      : 'Open Studio'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WizardSliderRow({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  const id = `wizard-slider-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex items-center gap-3">
      <label
        htmlFor={id}
        className="w-20 flex-shrink-0 text-[13px] leading-[20px] text-[var(--color-text-dim)]"
      >
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="flex-1 accent-[var(--color-primary)]"
      />
      <span className="w-16 flex-shrink-0 text-right text-[12px] font-mono text-[var(--color-text)]">
        {suffix}
      </span>
    </div>
  );
}
