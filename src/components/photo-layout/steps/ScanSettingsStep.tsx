'use client';

import { useCallback, useState } from 'react';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import type { QuiltDetectionConfig } from '@/lib/photo-layout-types';

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
    examples: "Drunkard's Path, Orange Peel, Wedding Ring, Clamshell",
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
        <div className="flex-1 min-w-0">
          <p className={`font-medium text-body-md ${checked ? 'text-primary' : 'text-on-surface'}`}>
            {label}
          </p>
          <p className="text-body-sm text-secondary mt-1">{helpText}</p>
          {examples && (
            <p className="text-label-sm text-secondary/70 mt-1.5">Examples: {examples}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
          <span className="text-label-sm text-secondary/60">{checked ? 'Yes' : 'No'}</span>
          <div
            className={`relative w-11 h-6 rounded-full transition-colors ${
              checked ? 'bg-primary' : 'bg-outline-variant/40'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 rounded-full bg-on-primary transition-transform ${
                checked ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </div>
        </div>
      </div>
    </button>
  );
}

export function ScanSettingsStep() {
  const setStep = usePhotoLayoutStore((s) => s.setStep);
  const setScanConfig = usePhotoLayoutStore((s) => s.setScanConfig);
  const existingConfig = usePhotoLayoutStore((s) => s.scanConfig);

  const [config, setConfig] = useState<QuiltDetectionConfig>({
    hasCurvedPiecing: existingConfig?.hasCurvedPiecing ?? false,
    hasApplique: existingConfig?.hasApplique ?? false,
    hasLowContrastSeams: existingConfig?.hasLowContrastSeams ?? false,
    hasHeavyTopstitching: existingConfig?.hasHeavyTopstitching ?? false,
    pieceScale: existingConfig?.pieceScale ?? 'standard',
    quiltShape: existingConfig?.quiltShape ?? 'rectangular',
  });

  const handleToggle = useCallback(
    (id: keyof Omit<QuiltDetectionConfig, 'pieceScale' | 'quiltShape'>) => {
      setConfig((prev) => ({ ...prev, [id]: !prev[id] }));
    },
    []
  );

  const handleContinue = useCallback(() => {
    setScanConfig(config);
    setStep('quiltDetails');
  }, [config, setScanConfig, setStep]);

  const handleBack = useCallback(() => {
    setStep('imagePrep');
  }, [setStep]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        <div>
          <h3 className="text-headline-sm font-semibold text-on-surface">
            Tell us about your quilt
          </h3>
          <p className="text-body-md text-secondary mt-1">
            These details help our scanner make smarter decisions. Don&apos;t worry — you can always
            adjust the results later.
          </p>
        </div>

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
      </div>

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
          className="btn-primary-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
