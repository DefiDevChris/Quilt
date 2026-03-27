'use client';

import { useEffect, useState } from 'react';
import type { StepProps } from '@/types/wizard';
import type { OcrWizardData } from '@/components/studio/QuiltPhotoImportWizard';
import { analyzeQuiltPhoto } from '@/lib/quilt-ocr-engine';
import type { OcrPipelineStep } from '@/types/quilt-ocr';

const STEP_LABELS = [
  'Preprocessing image...',
  'Detecting grid structure...',
  'Segmenting blocks...',
  'Recognizing patterns...',
  'Extracting colors...',
  'Computing measurements...',
  'Generating output...',
];

export function Step2Analysis({ data, onUpdate }: StepProps<OcrWizardData>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!data.imageData || data.analysisComplete || isRunning) return;

    setIsRunning(true);

    // Run analysis in next tick to allow UI to render
    const timeoutId = setTimeout(() => {
      const result = analyzeQuiltPhoto(
        data.imageData!,
        [], // No pre-computed signatures yet — will match manually
        { referenceWidthInches: data.referenceWidthInches },
        (step: OcrPipelineStep) => {
          if (step.status === 'running') {
            const stepIndex = STEP_LABELS.findIndex((l) =>
              l.toLowerCase().includes(step.name.toLowerCase().slice(0, 10))
            );
            if (stepIndex >= 0) setCurrentStep(stepIndex);
          }
        }
      );

      onUpdate({
        grid: result.grid,
        blocks: result.blocks,
        colors: result.colors,
        measurements: result.measurements,
        analysisComplete: true,
      });
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [data.imageData, data.analysisComplete, data.referenceWidthInches, isRunning, onUpdate]);

  return (
    <div className="py-8 text-center">
      <div className="w-12 h-12 mx-auto mb-4 border-3 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-title-md font-medium text-on-surface mb-6">
        Analyzing your quilt photo...
      </p>
      <div className="space-y-2 max-w-xs mx-auto">
        {STEP_LABELS.map((label, index) => (
          <div
            key={label}
            className={`flex items-center gap-2 text-body-sm transition-colors ${
              index < currentStep
                ? 'text-on-surface'
                : index === currentStep
                  ? 'text-primary font-medium'
                  : 'text-secondary/50'
            }`}
          >
            {index < currentStep ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 8L7 11L12 5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : index === currentStep ? (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-outline-variant/30" />
            )}
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
