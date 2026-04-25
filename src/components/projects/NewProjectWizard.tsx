'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Grid3X3, LayoutGrid, Rows3 } from 'lucide-react';

import { useLayoutStore } from '@/stores/layoutStore';
import { LAYOUT_PRESETS } from '@/lib/constants';
import type { ApplyableLayoutConfig } from '@/lib/layout/applyLayoutConfig';

// ─── Types ──────────────────────────────────────────────────────────────────

type WizardStep = 'mode' | 'layout' | 'details' | 'confirm';

interface WizardState {
  projectName: string;
  projectMode: 'quilt' | 'fabric-library' | null;
  selectedPresetId: string | null;
  layoutType: 'grid' | 'on-point' | 'row';
  rows: number;
  cols: number;
  blockSize: number;
  sashingWidth: number;
  hasBorders: boolean;
  hasCornerStones: boolean;
  bindingWidth: number;
}

interface NewProjectWizardProps {
  onConfirm: (config: ApplyableLayoutConfig) => void;
  allowDismiss?: boolean;
  onDismiss?: () => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STEP_ORDER: WizardStep[] = ['mode', 'layout', 'details', 'confirm'];

const STEP_LABELS: Record<WizardStep, string> = {
  mode: 'Project Type',
  layout: 'Layout',
  details: 'Details',
  confirm: 'Confirm',
};

const DEFAULT_STATE: WizardState = {
  projectName: '',
  projectMode: null,
  selectedPresetId: null,
  layoutType: 'grid',
  rows: 4,
  cols: 4,
  blockSize: 12,
  sashingWidth: 2,
  hasBorders: false,
  hasCornerStones: false,
  bindingWidth: 0.5,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StepIndicator({
  steps,
  currentStep,
}: {
  steps: WizardStep[];
  currentStep: WizardStep;
}) {
  const currentIndex = steps.indexOf(currentStep);
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={`
              flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium
              transition-colors duration-150
              ${
                index < currentIndex
                  ? 'bg-[var(--color-primary)] text-white'
                  : index === currentIndex
                    ? 'bg-[var(--color-primary)] text-white ring-2 ring-[var(--color-primary)] ring-offset-2'
                    : 'bg-[var(--color-bg)] text-[var(--color-text-dim)]'
              }
            `}
          >
            {index < currentIndex ? <Check className="w-4 h-4" /> : index + 1}
          </div>
          {index < steps.length - 1 && (
            <div
              className={`h-px w-8 transition-colors duration-150 ${
                index < currentIndex
                  ? 'bg-[var(--color-primary)]'
                  : 'bg-[var(--color-border)]'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function ModeStep({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}) {
  const modes = [
    {
      id: 'quilt' as const,
      label: 'Quilt Design',
      description: 'Design quilts block by block with full layout control',
      icon: Grid3X3,
    },
    {
      id: 'fabric-library' as const,
      label: 'Fabric Library',
      description: 'Organise and manage your fabric stash',
      icon: LayoutGrid,
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Choose project type</h3>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isSelected = state.projectMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => onChange({ projectMode: mode.id })}
            className={`
              w-full flex items-start gap-4 p-4 rounded-lg border-2
              transition-colors duration-150
              ${
                isSelected
                  ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]'
                  : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-secondary)] hover:bg-[var(--color-bg)]'
              }
            `}
          >
            <Icon
              className={`w-6 h-6 mt-0.5 flex-shrink-0 ${
                isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'
              }`}
            />
            <div className="text-left">
              <div
                className={`font-medium text-sm ${
                  isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                }`}
              >
                {mode.label}
              </div>
              <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
                {mode.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function LayoutStep({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}) {
  const layoutTypes = [
    {
      id: 'grid' as const,
      label: 'Straight Set',
      description: 'Blocks arranged in a traditional grid',
      icon: Grid3X3,
    },
    {
      id: 'on-point' as const,
      label: 'On Point',
      description: 'Blocks rotated 45° for a diagonal look',
      icon: LayoutGrid,
    },
    {
      id: 'row' as const,
      label: 'Row by Row',
      description: 'Blocks arranged in horizontal rows',
      icon: Rows3,
    },
  ];

  const presets = LAYOUT_PRESETS;

  return (
    <div className="space-y-6">
      {/* Layout type */}
      <div>
        <h3 className="text-base font-semibold text-[var(--color-text)] mb-3">Layout style</h3>
        <div className="grid grid-cols-3 gap-2">
          {layoutTypes.map((lt) => {
            const Icon = lt.icon;
            const isSelected = state.layoutType === lt.id;
            return (
              <button
                key={lt.id}
                onClick={() => onChange({ layoutType: lt.id })}
                className={`
                  flex flex-col items-center gap-2 p-3 rounded-lg border-2
                  transition-colors duration-150
                  ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]'
                      : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-secondary)]'
                  }
                `}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-dim)]'
                  }`}
                />
                <div className="text-center">
                  <div
                    className={`text-xs font-medium ${
                      isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                    }`}
                  >
                    {lt.label}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Presets */}
      {presets.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text)] mb-3">Preset dimensions</h3>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const isSelected = state.selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() =>
                    onChange({
                      selectedPresetId: isSelected ? null : preset.id,
                      ...(isSelected
                        ? {}
                        : {
                            rows: preset.rows,
                            cols: preset.cols,
                            blockSize: preset.blockSize,
                          }),
                    })
                  }
                  className={`
                    flex flex-col p-3 rounded-lg border-2 text-left
                    transition-colors duration-150
                    ${
                      isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]'
                        : 'border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-secondary)]'
                    }
                  `}
                >
                  <div
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
                    }`}
                  >
                    {preset.label}
                  </div>
                  <div className="text-xs text-[var(--color-text-dim)] mt-0.5">
                    {preset.rows}×{preset.cols} @ {preset.blockSize}\"
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailsStep({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (updates: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-[var(--color-text)]">Layout details</h3>

      {/* Grid dimensions */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1">
            Rows
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={state.rows}
            onChange={(e) => onChange({ rows: Number(e.target.value) })}
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1">
            Columns
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={state.cols}
            onChange={(e) => onChange({ cols: Number(e.target.value) })}
            className="input w-full"
          />
        </div>
      </div>

      {/* Block size */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1">
          Block size (inches)
        </label>
        <input
          type="number"
          min={2}
          max={24}
          step={0.5}
          value={state.blockSize}
          onChange={(e) => onChange({ blockSize: Number(e.target.value) })}
          className="input w-full"
        />
      </div>

      {/* Sashing */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1">
          Sashing width (inches)
        </label>
        <input
          type="number"
          min={0}
          max={6}
          step={0.25}
          value={state.sashingWidth}
          onChange={(e) => onChange({ sashingWidth: Number(e.target.value) })}
          className="input w-full"
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-[var(--color-text)]">Add borders</span>
          <input
            type="checkbox"
            checked={state.hasBorders}
            onChange={(e) => onChange({ hasBorders: e.target.checked })}
            className="toggle"
          />
        </label>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-sm text-[var(--color-text)]">Corner stones</span>
          <input
            type="checkbox"
            checked={state.hasCornerStones}
            onChange={(e) => onChange({ hasCornerStones: e.target.checked })}
            className="toggle"
          />
        </label>
      </div>

      {/* Binding */}
      <div>
        <label className="block text-xs font-medium text-[var(--color-text-dim)] mb-1">
          Binding width (inches)
        </label>
        <input
          type="number"
          min={0.25}
          max={2}
          step={0.25}
          value={state.bindingWidth}
          onChange={(e) => onChange({ bindingWidth: Number(e.target.value) })}
          className="input w-full"
        />
      </div>
    </div>
  );
}

function ConfirmStep({ state }: { state: WizardState }) {
  const selectedPreset = state.selectedPresetId
    ? LAYOUT_PRESETS.find((p) => p.id === state.selectedPresetId)
    : null;

  const summaryRows = [
    { label: 'Project type', value: state.projectMode === 'quilt' ? 'Quilt Design' : 'Fabric Library' },
    { label: 'Layout', value: state.layoutType === 'grid' ? 'Straight Set' : state.layoutType === 'on-point' ? 'On Point' : 'Row by Row' },
    ...(selectedPreset ? [{ label: 'Preset', value: selectedPreset.label }] : []),
    { label: 'Grid', value: `${state.rows} × ${state.cols}` },
    { label: 'Block size', value: `${state.blockSize}"` },
    { label: 'Sashing', value: `${state.sashingWidth}"` },
    { label: 'Borders', value: state.hasBorders ? 'Yes' : 'No' },
    { label: 'Corner stones', value: state.hasCornerStones ? 'Yes' : 'No' },
    { label: 'Binding', value: `${state.bindingWidth}"` },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-[var(--color-text)]">Confirm your setup</h3>
      <dl className="space-y-2">
        {summaryRows.map((row) => (
          <div key={row.label} className="flex justify-between items-center py-1 border-b border-[var(--color-border)]">
            <dt className="text-xs text-[var(--color-text-dim)]">{row.label}</dt>
            <dd className="text-xs font-medium text-[var(--color-text)]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NewProjectWizard({
  onConfirm,
  allowDismiss = false,
  onDismiss,
}: NewProjectWizardProps) {
  const [wizardState, setWizardState] = useState<WizardState>(DEFAULT_STATE);
  const [currentStep, setCurrentStep] = useState<WizardStep>('mode');

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setWizardState((prev) => ({ ...prev, ...updates }));
  }, []);

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === STEP_ORDER.length - 1;

  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case 'mode':
        return wizardState.projectMode !== null;
      case 'layout':
        return true;
      case 'details':
        return wizardState.rows > 0 && wizardState.cols > 0 && wizardState.blockSize > 0;
      case 'confirm':
        return true;
      default:
        return false;
    }
  }, [currentStep, wizardState]);

  const handleBack = useCallback(() => {
    if (!isFirst) setCurrentStep(STEP_ORDER[currentIndex - 1]);
  }, [isFirst, currentIndex]);

  const handleNext = useCallback(() => {
    if (isLast) {
      // Build the config and hand off to the parent.
      const config: ApplyableLayoutConfig = {
        layoutType: wizardState.layoutType,
        rows: wizardState.rows,
        cols: wizardState.cols,
        blockSize: wizardState.blockSize,
        sashing: {
          width: wizardState.sashingWidth,
          enabled: wizardState.sashingWidth > 0,
        },
        borders: {
          enabled: wizardState.hasBorders,
          width: 2,
        },
        hasCornerStones: wizardState.hasCornerStones,
        bindingWidth: wizardState.bindingWidth,
        selectedPresetId: wizardState.selectedPresetId,
      };
      onConfirm(config);
    } else {
      setCurrentStep(STEP_ORDER[currentIndex + 1]);
    }
  }, [isLast, currentIndex, wizardState, onConfirm]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="New project setup"
      className="relative w-full max-w-lg rounded-lg bg-[var(--color-surface)] p-8 shadow-elevated"
    >
      {/* Dismiss button */}
      {allowDismiss && onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Close wizard"
          className="absolute top-4 right-4 p-1 rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition-colors duration-150"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <StepIndicator steps={STEP_ORDER} currentStep={currentStep} />

      {/* Step content */}
      <div className="min-h-[260px]">
        {currentStep === 'mode' && (
          <ModeStep state={wizardState} onChange={updateState} />
        )}
        {currentStep === 'layout' && (
          <LayoutStep state={wizardState} onChange={updateState} />
        )}
        {currentStep === 'details' && (
          <DetailsStep state={wizardState} onChange={updateState} />
        )}
        {currentStep === 'confirm' && (
          <ConfirmStep state={wizardState} />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-4 border-t border-[var(--color-border)]">
        <button
          onClick={handleBack}
          disabled={isFirst}
          className="btn-secondary flex items-center gap-1 text-sm disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canAdvance}
          className="btn-primary flex items-center gap-1 text-sm disabled:opacity-40 transition-colors duration-150"
        >
          {isLast ? 'Create Project' : 'Next'}
          {!isLast && <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
