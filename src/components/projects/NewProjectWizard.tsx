'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QUILT_SIZE_PRESETS } from '@/lib/constants';
import { LAYOUT_PRESETS, getLayoutPreset, type LayoutPreset } from '@/lib/layout-library';
import {
  computeLayoutSize,
  computeTemplateSize,
  type QuiltTemplateForSizing,
  type StandardBlockSize,
} from '@/lib/quilt-sizing';
import { BlockSizePicker } from './BlockSizePicker';

type PathType = 'template' | 'layout' | 'scratch';

interface QuiltTemplate {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  finishedWidth: number | null;
  finishedHeight: number | null;
  thumbnailUrl: string | null;
  templateData: unknown;
}

interface NewProjectWizardProps {
  readonly open: boolean;
  readonly onClose: () => void;
}

const DEFAULT_BLOCK_SIZE: StandardBlockSize = 12;

export function NewProjectWizard({ open, onClose }: NewProjectWizardProps) {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [path, setPath] = useState<PathType | null>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Scratch path state
  const [scratchPresetLabel, setScratchPresetLabel] = useState<string>('Throw');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');

  // Layout path state
  const [layoutPresetId, setLayoutPresetId] = useState<string>(LAYOUT_PRESETS[0]?.id ?? '');
  const [layoutBlockSize, setLayoutBlockSize] = useState<StandardBlockSize>(DEFAULT_BLOCK_SIZE);
  const [layoutRotated, setLayoutRotated] = useState(false);

  // Template path state
  const [templates, setTemplates] = useState<QuiltTemplate[] | null>(null);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templateBlockSize, setTemplateBlockSize] = useState<StandardBlockSize>(DEFAULT_BLOCK_SIZE);
  const [templateRotated, setTemplateRotated] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<Element | null>(null);

  // Reset everything whenever the modal closes so reopening starts fresh.
  // Run via the effect cleanup so the state resets happen after unmount
  // rather than during the same render that hid the dialog (avoids the
  // synchronous-setState-in-effect lint).
  useEffect(() => {
    if (!open) return;
    return () => {
      setStep(1);
      setPath(null);
      setName('');
      setError(null);
      setIsCreating(false);
      setScratchPresetLabel('Throw');
      setCustomWidth('');
      setCustomHeight('');
      setLayoutPresetId(LAYOUT_PRESETS[0]?.id ?? '');
      setLayoutBlockSize(DEFAULT_BLOCK_SIZE);
      setLayoutRotated(false);
      setSelectedTemplateId(null);
      setTemplateBlockSize(DEFAULT_BLOCK_SIZE);
      setTemplateRotated(false);
    };
  }, [open]);

  // Focus management.
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

  // Escape closes.
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

  // Lazy-load templates the first time the user picks the Template path.
  // Defer the loading-state setState to a microtask so the lint rule doesn't
  // see it as a synchronous-during-effect mutation.
  useEffect(() => {
    if (path !== 'template' || templates !== null || templatesLoading) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setTemplatesLoading(true);
      setTemplatesError(null);
      fetch('/api/layout-templates')
        .then(async (res) => {
          if (!res.ok) throw new Error('Request failed');
          const json = (await res.json()) as { success?: boolean; data?: QuiltTemplate[] };
          if (cancelled) return;
          setTemplates(json.data ?? []);
        })
        .catch(() => {
          if (cancelled) return;
          setTemplatesError('Could not load templates. Try again later.');
          setTemplates([]);
        })
        .finally(() => {
          if (!cancelled) setTemplatesLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, [path, templates, templatesLoading]);

  const activeLayoutPreset: LayoutPreset | undefined = useMemo(
    () => getLayoutPreset(layoutPresetId),
    [layoutPresetId]
  );

  const layoutSize = useMemo(() => {
    if (!activeLayoutPreset) return { width: 0, height: 0 };
    return computeLayoutSize(activeLayoutPreset, layoutBlockSize, layoutRotated);
  }, [activeLayoutPreset, layoutBlockSize, layoutRotated]);

  const selectedTemplate = useMemo<QuiltTemplate | null>(() => {
    if (!selectedTemplateId || !templates) return null;
    return templates.find((t) => t.id === selectedTemplateId) ?? null;
  }, [selectedTemplateId, templates]);

  const templateSize = useMemo(() => {
    if (!selectedTemplate) return { width: 0, height: 0 };
    const adapter: QuiltTemplateForSizing = {
      finishedWidth: selectedTemplate.finishedWidth,
      finishedHeight: selectedTemplate.finishedHeight,
      templateData: selectedTemplate.templateData,
    };
    return computeTemplateSize(adapter, templateBlockSize, templateRotated);
  }, [selectedTemplate, templateBlockSize, templateRotated]);

  const scratchPreset = useMemo(
    () => QUILT_SIZE_PRESETS.find((p) => p.label === scratchPresetLabel),
    [scratchPresetLabel]
  );

  const isCustom = scratchPresetLabel === 'Custom';

  const handlePickPath = useCallback((next: PathType) => {
    setPath(next);
    setError(null);
    setName((prev) => (prev && prev.trim().length > 0 ? prev : 'Untitled Quilt'));
    setStep(2);
  }, []);

  const canSubmit = useMemo(() => {
    if (isCreating || !name.trim()) return false;
    if (path === 'scratch') {
      if (isCustom) {
        const w = parseFloat(customWidth);
        const h = parseFloat(customHeight);
        return Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0;
      }
      return Boolean(scratchPreset);
    }
    if (path === 'layout') return Boolean(activeLayoutPreset);
    if (path === 'template') return Boolean(selectedTemplate);
    return false;
  }, [
    isCreating,
    name,
    path,
    isCustom,
    customWidth,
    customHeight,
    scratchPreset,
    activeLayoutPreset,
    selectedTemplate,
  ]);

  const handleCreate = useCallback(async () => {
    if (!canSubmit) return;
    setError(null);
    setIsCreating(true);

    type CreatePayload = {
      name: string;
      unitSystem: 'imperial' | 'metric';
      canvasWidth: number;
      canvasHeight: number;
      gridSettings: { enabled: boolean; size: number; snapToGrid: boolean };
      initialLayout?: { presetId: string; blockSize: number; rotated: boolean };
      initialTemplate?: { templateId: string; blockSize: number; rotated: boolean };
    };

    const payload: CreatePayload = {
      name: name.trim(),
      unitSystem: 'imperial',
      canvasWidth: 48,
      canvasHeight: 48,
      gridSettings: { enabled: true, size: 1, snapToGrid: true },
    };

    if (path === 'scratch') {
      if (isCustom) {
        payload.canvasWidth = parseFloat(customWidth);
        payload.canvasHeight = parseFloat(customHeight);
      } else if (scratchPreset) {
        payload.canvasWidth = scratchPreset.width;
        payload.canvasHeight = scratchPreset.height;
      }
    } else if (path === 'layout' && activeLayoutPreset) {
      payload.initialLayout = {
        presetId: activeLayoutPreset.id,
        blockSize: layoutBlockSize,
        rotated: layoutRotated,
      };
      payload.canvasWidth = layoutSize.width;
      payload.canvasHeight = layoutSize.height;
    } else if (path === 'template' && selectedTemplate) {
      payload.initialTemplate = {
        templateId: selectedTemplate.id,
        blockSize: templateBlockSize,
        rotated: templateRotated,
      };
      payload.canvasWidth = templateSize.width;
      payload.canvasHeight = templateSize.height;
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
      onClose();
      router.push(`/studio/${newId}`);
    } catch {
      setError('Failed to create project');
      setIsCreating(false);
    }
  }, [
    canSubmit,
    name,
    path,
    isCustom,
    customWidth,
    customHeight,
    scratchPreset,
    activeLayoutPreset,
    layoutBlockSize,
    layoutRotated,
    layoutSize,
    selectedTemplate,
    templateBlockSize,
    templateRotated,
    templateSize,
    onClose,
    router,
  ]);

  if (!open) return null;

  const stepHeading =
    step === 1
      ? 'Start a New Project'
      : path === 'template'
        ? 'Pick a Template'
        : path === 'layout'
          ? 'Configure Your Layout'
          : 'Pick a Canvas Size';

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
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-elevation-3 focus:outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-secondary hover:text-on-surface text-sm font-medium"
                aria-label="Back to start"
              >
                ← Back
              </button>
            )}
            <h2
              id="new-project-wizard-title"
              className="text-xl font-extrabold text-on-surface tracking-tight"
            >
              {stepHeading}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-secondary hover:text-on-surface w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container transition-colors"
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
          <div className="mx-6 mt-4 rounded-md bg-error/10 border border-error/20 px-4 py-2 text-sm text-error">
            {error}
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-6">
          {step === 1 && (
            <div>
              <p className="text-sm text-secondary mb-6">
                Choose how you&apos;d like to begin. You can change everything later.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <PathCard
                  title="Template"
                  description="Full quilt design with layout, blocks, and suggested fabrics."
                  icon={<TemplateIcon />}
                  onClick={() => handlePickPath('template')}
                />
                <PathCard
                  title="Layout"
                  description="Pick a structure: rows, sashing, borders. Add blocks later."
                  icon={<LayoutIcon />}
                  onClick={() => handlePickPath('layout')}
                />
                <PathCard
                  title="Scratch"
                  description="Empty canvas. Total freedom to drag in anything."
                  icon={<ScratchIcon />}
                  onClick={() => handlePickPath('scratch')}
                />
              </div>
            </div>
          )}

          {step === 2 && path === 'scratch' && (
            <div className="space-y-5">
              <p className="text-sm text-secondary">Pick the finished size of your quilt.</p>
              <div className="grid grid-cols-2 gap-2">
                {QUILT_SIZE_PRESETS.map((preset) => {
                  const isActive = scratchPresetLabel === preset.label;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setScratchPresetLabel(preset.label)}
                      className={
                        isActive
                          ? 'flex items-center justify-between rounded-lg px-3 py-2.5 bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                          : 'flex items-center justify-between rounded-lg px-3 py-2.5 bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors'
                      }
                    >
                      <span className="text-sm font-medium">{preset.label}</span>
                      <span
                        className={
                          isActive
                            ? 'text-xs font-mono text-white/80'
                            : 'text-xs font-mono text-secondary'
                        }
                      >
                        {preset.width}″ × {preset.height}″
                      </span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setScratchPresetLabel('Custom')}
                  className={
                    isCustom
                      ? 'col-span-2 rounded-lg px-3 py-2.5 bg-gradient-to-r from-orange-500 to-rose-400 text-white text-sm font-medium shadow-elevation-1'
                      : 'col-span-2 rounded-lg px-3 py-2.5 bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors'
                  }
                >
                  Custom Size
                </button>
              </div>
              {isCustom && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="wizard-w" className="block text-xs text-secondary mb-1">
                      Width (in)
                    </label>
                    <input
                      id="wizard-w"
                      type="number"
                      min={1}
                      max={200}
                      step={0.5}
                      value={customWidth}
                      onChange={(e) => setCustomWidth(e.target.value)}
                      className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="e.g. 60"
                    />
                  </div>
                  <div>
                    <label htmlFor="wizard-h" className="block text-xs text-secondary mb-1">
                      Height (in)
                    </label>
                    <input
                      id="wizard-h"
                      type="number"
                      min={1}
                      max={200}
                      step={0.5}
                      value={customHeight}
                      onChange={(e) => setCustomHeight(e.target.value)}
                      className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      placeholder="e.g. 72"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && path === 'layout' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="layout-preset"
                    className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2"
                  >
                    Layout Skeleton
                  </label>
                  <select
                    id="layout-preset"
                    value={layoutPresetId}
                    onChange={(e) => setLayoutPresetId(e.target.value)}
                    className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {LAYOUT_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                  {activeLayoutPreset && (
                    <p className="text-xs text-secondary mt-1.5">
                      {activeLayoutPreset.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
                    Block Size
                  </label>
                  <BlockSizePicker value={layoutBlockSize} onChange={setLayoutBlockSize} />
                </div>

                {activeLayoutPreset &&
                  activeLayoutPreset.config.rows !== activeLayoutPreset.config.cols && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layoutRotated}
                        onChange={(e) => setLayoutRotated(e.target.checked)}
                        className="rounded accent-primary"
                      />
                      <span className="text-sm text-secondary">Rotate 90° (landscape)</span>
                    </label>
                  )}
              </div>

              <SizePreviewCard
                width={layoutSize.width}
                height={layoutSize.height}
                helper={
                  activeLayoutPreset
                    ? `${activeLayoutPreset.config.rows} × ${activeLayoutPreset.config.cols} blocks`
                    : ''
                }
              />
            </div>
          )}

          {step === 2 && path === 'template' && (
            <div>
              {templatesLoading && (
                <p className="text-sm text-secondary py-8 text-center">Loading templates…</p>
              )}
              {!templatesLoading && templatesError && (
                <p className="text-sm text-error py-8 text-center">{templatesError}</p>
              )}
              {!templatesLoading && !templatesError && templates && templates.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-base font-semibold text-on-surface">No templates yet</p>
                  <p className="text-sm text-secondary mt-1.5">
                    The template library is empty right now. Pick Layout or Scratch to get started.
                  </p>
                </div>
              )}
              {!templatesLoading && !templatesError && templates && templates.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <ul className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {templates.map((tpl) => {
                        const isActive = selectedTemplateId === tpl.id;
                        return (
                          <li key={tpl.id}>
                            <button
                              type="button"
                              onClick={() => setSelectedTemplateId(tpl.id)}
                              className={
                                isActive
                                  ? 'w-full text-left rounded-lg px-3 py-2.5 bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                                  : 'w-full text-left rounded-lg px-3 py-2.5 bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors'
                              }
                            >
                              <div className="text-sm font-semibold">{tpl.name}</div>
                              {tpl.description && (
                                <div
                                  className={
                                    isActive
                                      ? 'text-xs text-white/80 mt-0.5'
                                      : 'text-xs text-secondary mt-0.5'
                                  }
                                >
                                  {tpl.description}
                                </div>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {selectedTemplate && (
                      <>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
                            Block Size
                          </label>
                          <BlockSizePicker
                            value={templateBlockSize}
                            onChange={setTemplateBlockSize}
                          />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={templateRotated}
                            onChange={(e) => setTemplateRotated(e.target.checked)}
                            className="rounded accent-primary"
                          />
                          <span className="text-sm text-secondary">Rotate 90° (landscape)</span>
                        </label>
                      </>
                    )}
                  </div>

                  {selectedTemplate ? (
                    <SizePreviewCard
                      width={templateSize.width}
                      height={templateSize.height}
                      helper={selectedTemplate.name}
                    />
                  ) : (
                    <div className="rounded-xl bg-surface-container/60 border border-outline-variant/40 flex items-center justify-center text-sm text-secondary p-8">
                      Pick a template to see its size.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="mt-8 pt-5 border-t border-outline-variant/30 space-y-4">
              <div>
                <label
                  htmlFor="wizard-name"
                  className="block text-xs font-semibold uppercase tracking-wider text-secondary mb-2"
                >
                  Project Name
                </label>
                <input
                  id="wizard-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                  placeholder="Untitled Quilt"
                  className="w-full rounded-md border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-secondary hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={!canSubmit}
                  className="rounded-full bg-gradient-to-r from-orange-500 to-rose-400 px-5 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PathCardProps {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
  readonly onClick: () => void;
}

function PathCard({ title, description, icon, onClick }: PathCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl border border-white/60 bg-white/80 backdrop-blur-sm p-5 hover:bg-white/90 hover:shadow-[0_4px_16px_rgba(198,123,92,0.1)] transition-all duration-200 group"
    >
      <div className="w-12 h-12 rounded-xl bg-primary-container flex items-center justify-center text-warm-terracotta mb-4">
        {icon}
      </div>
      <h3 className="text-base font-extrabold text-on-surface mb-1 group-hover:text-primary-dark transition-colors">
        {title}
      </h3>
      <p className="text-xs text-secondary leading-relaxed">{description}</p>
    </button>
  );
}

interface SizePreviewCardProps {
  readonly width: number;
  readonly height: number;
  readonly helper: string;
}

function SizePreviewCard({ width, height, helper }: SizePreviewCardProps) {
  return (
    <div className="rounded-xl bg-surface-container/60 border border-outline-variant/40 p-6 flex flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold uppercase tracking-wider text-secondary mb-2">
        Finished Size
      </p>
      <div className="text-3xl font-extrabold text-on-surface tracking-tight">
        {width}″ × {height}″
      </div>
      {helper && <p className="text-xs text-secondary mt-2">{helper}</p>}
    </div>
  );
}

/* ── Icons ──────────────────────────────────────────────────────── */

function TemplateIcon() {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect
        x="13"
        y="13"
        width="8"
        height="8"
        rx="1.5"
        fill="currentColor"
        opacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function LayoutIcon() {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <line x1="3" y1="9" x2="21" y2="9" stroke="currentColor" strokeWidth="2" />
      <line x1="3" y1="15" x2="21" y2="15" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="3" x2="9" y2="21" stroke="currentColor" strokeWidth="2" />
      <line x1="15" y1="3" x2="15" y2="21" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ScratchIcon() {
  return (
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" aria-hidden="true">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="4 3"
      />
      <line
        x1="12"
        y1="8"
        x2="12"
        y2="16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1="8"
        y1="12"
        x2="16"
        y2="12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
