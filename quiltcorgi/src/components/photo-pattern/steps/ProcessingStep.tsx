'use client';

import { useEffect, useRef } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { loadOpenCv } from '@/lib/opencv-loader';
import { runDetectionPipeline } from '@/lib/photo-pattern-utils';
import type { PipelineStepStatus } from '@/lib/photo-pattern-types';

function StepIcon({ status }: { readonly status: PipelineStepStatus }) {
  if (status === 'complete') {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-success flex-shrink-0"
      >
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6 10L9 13L14 7"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (status === 'running') {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="text-primary flex-shrink-0 animate-spin"
      >
        <circle
          cx="10"
          cy="10"
          r="9"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="40 20"
        />
      </svg>
    );
  }

  if (status === 'error') {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="text-error flex-shrink-0"
      >
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 7L13 13M13 7L7 13"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // pending
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      className="text-secondary/40 flex-shrink-0"
    >
      <circle cx="10" cy="10" r="4" fill="currentColor" />
    </svg>
  );
}

export function ProcessingStep() {
  const originalImage = usePhotoPatternStore((s) => s.originalImage);
  const sensitivity = usePhotoPatternStore((s) => s.sensitivity);
  const scanConfig = usePhotoPatternStore((s) => s.scanConfig);
  const pipelineSteps = usePhotoPatternStore((s) => s.pipelineSteps);
  const setPipelineSteps = usePhotoPatternStore((s) => s.setPipelineSteps);
  const setDetectedPieces = usePhotoPatternStore((s) => s.setDetectedPieces);
  const setCorrectedImage = usePhotoPatternStore((s) => s.setCorrectedImage);
  const setStep = usePhotoPatternStore((s) => s.setStep);

  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    if (!originalImage) return;
    hasStartedRef.current = true;

    const runPipeline = async () => {
      try {
        const cv = await loadOpenCv();
        const result = await runDetectionPipeline(
          cv,
          originalImage,
          (steps) => {
            setPipelineSteps(steps);
          },
          { sensitivity, scanConfig }
        );

        setDetectedPieces(result.pieces);
        if (result.correctedImageData) {
          setCorrectedImage(result.correctedImageData);
        }

        // Auto-advance after a short delay
        setTimeout(() => {
          setStep('results');
        }, 400);
      } catch {
        // Error state is handled by the pipeline's own error reporting
      }
    };

    runPipeline();
  }, [
    originalImage,
    sensitivity,
    scanConfig,
    setPipelineSteps,
    setDetectedPieces,
    setCorrectedImage,
    setStep,
  ]);

  const hasError = pipelineSteps.some((s) => s.status === 'error');
  const errorStep = pipelineSteps.find((s) => s.status === 'error');

  return (
    <div className="flex flex-col items-center justify-center h-full gap-8">
      <div className="text-center">
        <h3 className="text-headline-sm font-semibold text-on-surface mb-1">
          Analyzing your quilt
        </h3>
        <p className="text-body-md text-secondary">
          Detecting pieces and extracting the pattern...
        </p>
      </div>

      {/* Vertical stepper */}
      <div className="w-full max-w-sm space-y-3">
        {pipelineSteps.map((pipelineStep, index) => (
          <div key={index} className="flex items-center gap-3">
            <StepIcon status={pipelineStep.status} />
            <span
              className={`text-body-md ${
                pipelineStep.status === 'running'
                  ? 'text-on-surface font-medium'
                  : pipelineStep.status === 'complete'
                    ? 'text-secondary'
                    : pipelineStep.status === 'error'
                      ? 'text-error'
                      : 'text-secondary/50'
              }`}
            >
              {pipelineStep.name}
            </span>
          </div>
        ))}
      </div>

      {/* Error state */}
      {hasError && errorStep && (
        <div className="text-center space-y-3">
          <p className="text-body-sm text-error">
            {errorStep.message ?? 'Something went wrong during analysis.'}
          </p>
          <button
            type="button"
            onClick={() => setStep('correction')}
            className="px-4 py-2 text-body-md text-on-surface bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors border border-outline-variant/20"
          >
            Go back and adjust
          </button>
        </div>
      )}
    </div>
  );
}
