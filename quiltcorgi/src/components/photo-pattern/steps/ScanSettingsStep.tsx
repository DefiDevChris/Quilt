'use client';

import { useCallback, useState } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import type { QuiltDetectionConfig, QuiltShapeType } from '@/lib/photo-pattern-types';

interface ToggleOption {
  id: keyof Omit<QuiltDetectionConfig, 'pieceScale' | 'quiltShape'>;
  label: string;
  helpText: string;
  examples?: string;
}

const TOGGLE_OPTIONS: readonly ToggleOption[] = [
  {
    id: 'hasCurvedPiecing',
    label: 'Does this quilt have curved seams?',
    helpText: 'Tells our engine not to force straight lines.',
    examples: 'Drunkard\'s Path, Orange Peel, Wedding Ring, Clamshell',
  },
  {
    id: 'hasApplique',
    label: 'Are there shapes sewn on top of the background?',
    helpText: 'Appliqué designs with fabric shapes layered on top.',
    examples: 'Needle-turn appliqué, raw-edge appliqué, fused shapes',
  },
  {
    id: 'hasLowContrastSeams',
    label: 'Are there pieces of the exact same fabric sewn touching each other?',
    helpText: 'Helps us find seams between identical fabrics.',
    examples: 'Tone-on-tone layouts, matching background pieces',
  },
  {
    id: 'hasHeavyTopstitching',
    label: 'Is there heavy quilting or embroidery over the pieces?',
    helpText: 'Tells our engine to ignore thick threads and focus on the piecing.',
    examples: 'Dense free-motion quilting, sashiko, visible stitching',
  },
];

type PieceScaleOption = {
  value: QuiltDetectionConfig['pieceScale'];
  label: string;
  description: string;
};

const PIECE_SCALE_OPTIONS: readonly PieceScaleOption[] = [
  {
    value: 'tiny',
    label: 'Tiny / Postage Stamp',
    description: 'Pieces smaller than 2" — like postage stamp quilts',
  },
  {
    value: 'standard',
    label: 'Standard',
    description: 'Typical patchwork pieces, 2–6" finished',
  },
  {
    value: 'large',
    label: 'Large / Chunky',
    description: 'Big pieces, 6"+ — like modern quilt blocks',
  },
];

type QuiltShapeOption = {
  value: QuiltShapeType;
  label: string;
  description: string;
  icon: string;
};

const QUILT_SHAPE_OPTIONS: readonly QuiltShapeOption[] = [
  {
    value: 'rectangular',
    label: 'Rectangular / Square',
    description: 'Standard four-sided quilt',
    icon: '□',
  },
  {
    value: 'circular',
    label: 'Circular / Round',
    description: 'Mandala or round quilts — empty corners handled',
    icon: '○',
  },
  {
    value: 'hexagonal',
    label: 'Hexagonal',
    description: 'Honeycomb or Grandmother\'s Flower Garden',
    icon: '⬡',
  },
  {
    value: 'irregular',
    label: 'Other / Irregular',
    description: 'Scalloped edges or custom shapes',
    icon: '◎',
  },
];

function ToggleSwitch({
  checked,
  onChange,
  label,
  helpText,
  examples,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  helpText: string;
  examples?: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
        checked
          ? 'border-primary bg-primary/5'
          : 'border-outline-variant/20 hover:border-outline-variant/40 bg-surface-container'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
            checked ? 'bg-primary' : 'bg-outline-variant/40'
          }`}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-on-primary transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-body-md ${checked ? 'text-primary' : 'text-on-surface'}`}>
            {label}
          </p>
          <p className="text-body-sm text-secondary mt-1">{helpText}</p>
          {examples && (
            <p className="text-label-sm text-secondary/70 mt-1.5">
              Examples: {examples}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function PieceScaleSelector({
  value,
  onChange,
}: {
  value: QuiltDetectionConfig['pieceScale'];
  onChange: (value: QuiltDetectionConfig['pieceScale']) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-body-lg font-medium text-on-surface">
          How big are the pieces generally?
        </p>
        <p className="text-body-sm text-secondary mt-1">
          This helps us tune the noise filter so we don&apos;t miss small pieces or get fooled by lint.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PIECE_SCALE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-outline-variant/20 hover:border-outline-variant/40 bg-surface-container'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  value === option.value
                    ? 'border-primary'
                    : 'border-outline-variant'
                }`}
              >
                {value === option.value && (
                  <div className="w-2 h-2 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={`font-medium text-body-sm ${
                  value === option.value ? 'text-primary' : 'text-on-surface'
                }`}
              >
                {option.label}
              </span>
            </div>
            <p className="text-label-sm text-secondary leading-relaxed">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuiltShapeSelector({
  value,
  onChange,
}: {
  value: QuiltShapeType;
  onChange: (value: QuiltShapeType) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-body-lg font-medium text-on-surface">
          What shape is your quilt?
        </p>
        <p className="text-body-sm text-secondary mt-1">
          We&apos;ll handle edge pieces and empty space correctly for non-rectangular quilts.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {QUILT_SHAPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              value === option.value
                ? 'border-primary bg-primary/5'
                : 'border-outline-variant/20 hover:border-outline-variant/40 bg-surface-container'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{option.icon}</span>
              <div>
                <p
                  className={`font-medium text-body-sm ${
                    value === option.value ? 'text-primary' : 'text-on-surface'
                  }`}
                >
                  {option.label}
                </p>
                <p className="text-label-sm text-secondary mt-1 leading-relaxed">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScanSettingsStep() {
  const setStep = usePhotoPatternStore((s) => s.setStep);
  const setScanConfig = usePhotoPatternStore((s) => s.setScanConfig);
  const existingConfig = usePhotoPatternStore((s) => s.scanConfig);

  const [config, setConfig] = useState<QuiltDetectionConfig>({
    hasCurvedPiecing: existingConfig?.hasCurvedPiecing ?? false,
    hasApplique: existingConfig?.hasApplique ?? false,
    hasLowContrastSeams: existingConfig?.hasLowContrastSeams ?? false,
    hasHeavyTopstitching: existingConfig?.hasHeavyTopstitching ?? false,
    pieceScale: existingConfig?.pieceScale ?? 'standard',
    quiltShape: existingConfig?.quiltShape ?? 'rectangular',
  });

  const handleToggle = useCallback((id: keyof Omit<QuiltDetectionConfig, 'pieceScale' | 'quiltShape'>) => {
    setConfig((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handlePieceScaleChange = useCallback((value: QuiltDetectionConfig['pieceScale']) => {
    setConfig((prev) => ({ ...prev, pieceScale: value }));
  }, []);

  const handleQuiltShapeChange = useCallback((value: QuiltShapeType) => {
    setConfig((prev) => ({ ...prev, quiltShape: value }));
  }, []);

  const handleContinue = useCallback(() => {
    setScanConfig(config);
    setStep('correction');
  }, [config, setScanConfig, setStep]);

  const handleBack = useCallback(() => {
    setStep('upload');
  }, [setStep]);

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-headline-sm font-semibold text-on-surface">
            Tell us about your quilt
          </h3>
          <p className="text-body-md text-secondary mt-1">
            These details help our scanner make smarter decisions. Don&apos;t worry — you can always adjust the results later.
          </p>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {TOGGLE_OPTIONS.map((option) => (
            <ToggleSwitch
              key={option.id}
              checked={config[option.id]}
              onChange={() => handleToggle(option.id)}
              label={option.label}
              helpText={option.helpText}
              examples={option.examples}
            />
          ))}
        </div>

        {/* Piece Scale Selector */}
        <PieceScaleSelector
          value={config.pieceScale}
          onChange={handlePieceScaleChange}
        />

        {/* Quilt Shape Selector */}
        <QuiltShapeSelector
          value={config.quiltShape}
          onChange={handleQuiltShapeChange}
        />

        {/* Help box */}
        <div className="p-4 rounded-lg bg-surface-container-high/50 border border-outline-variant/30">
          <p className="text-body-sm text-secondary">
            <span className="font-medium text-on-surface">Not sure?</span> That&apos;s okay! The default settings work well for most quilts. You can always go with &quot;Standard&quot; and see how it looks.
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex justify-between pt-4 mt-4 border-t border-outline-variant/20 flex-shrink-0">
        <button
          type="button"
          onClick={handleBack}
          className="px-6 py-2.5 text-body-md font-medium text-on-surface bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors border border-outline-variant/20"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="px-6 py-2.5 text-body-md font-medium text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
