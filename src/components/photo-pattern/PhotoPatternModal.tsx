'use client';

import { useCallback, useEffect } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import { loadOpenCv } from '@/lib/opencv-loader';
import { UploadStep } from './steps/UploadStep';
import { ImagePrepStep } from './steps/ImagePrepStep';
import { ScanSettingsStep } from './steps/ScanSettingsStep';
import { CorrectionStep } from './steps/CorrectionStep';
import { ProcessingStep } from './steps/ProcessingStep';
import { ResultsStep } from './steps/ResultsStep';
import { DimensionsStep } from './steps/DimensionsStep';
import type { PhotoPatternStep } from '@/lib/photo-pattern-types';

const VISIBLE_STEPS: readonly PhotoPatternStep[] = [
  'upload',
  'imagePrep',
  'scanSettings',
  'correction',
  'processing',
  'results',
  'dimensions',
];

const STEP_SUBTITLES: Record<PhotoPatternStep, string> = {
  upload: 'Upload your quilt photo',
  imagePrep: 'Straighten, flip, or correct perspective',
  scanSettings: 'Tell us about your quilt',
  correction: 'Adjust perspective (optional)',
  processing: 'Analyzing...',
  results: 'Review detected pieces',
  dimensions: 'Set quilt dimensions',
  complete: '',
};

function StepContent({ step }: { readonly step: PhotoPatternStep }) {
  switch (step) {
    case 'upload':
      return <UploadStep />;
    case 'imagePrep':
      return <ImagePrepStep />;
    case 'scanSettings':
      return <ScanSettingsStep />;
    case 'correction':
      return <CorrectionStep />;
    case 'processing':
      return <ProcessingStep />;
    case 'results':
      return <ResultsStep />;
    case 'dimensions':
      return <DimensionsStep />;
    default:
      return null;
  }
}

export function PhotoPatternModal() {
  const isModalOpen = usePhotoPatternStore((s) => s.isModalOpen);
  const step = usePhotoPatternStore((s) => s.step);
  const reset = usePhotoPatternStore((s) => s.reset);
  const closeModal = usePhotoPatternStore((s) => s.closeModal);

  // Pre-load OpenCV when modal opens (non-blocking)
  useEffect(() => {
    if (isModalOpen) {
      loadOpenCv().catch(() => {
        // Non-blocking — will retry when actually needed
      });
    }
  }, [isModalOpen]);

  // Escape key closes modal
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        reset();
        closeModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, reset, closeModal]);

  const handleClose = useCallback(() => {
    reset();
    closeModal();
  }, [reset, closeModal]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        handleClose();
      }
    },
    [handleClose]
  );

  // Return null when complete (parent handles navigation)
  if (!isModalOpen || step === 'complete') return null;

  const currentStepIndex = VISIBLE_STEPS.indexOf(step);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="glass-elevated rounded-xl w-[95vw] max-w-[1000px] h-[80vh] flex flex-col"
        role="dialog"
        aria-label="Photo to Pattern"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 flex-shrink-0">
          <div>
            <h2 className="text-headline-md font-semibold text-on-surface">Photo to Pattern</h2>
            <p className="text-body-sm text-secondary mt-0.5">{STEP_SUBTITLES[step]}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center text-secondary hover:text-on-surface transition-colors rounded-md hover:bg-surface-container"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M4.5 4.5L13.5 13.5M13.5 4.5L4.5 13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Step content */}
        <div className="flex-1 min-h-0 px-6 py-4 overflow-y-auto">
          <StepContent step={step} />
        </div>

        {/* Step indicator dots */}
        <div className="flex items-center justify-center gap-2 pb-4 flex-shrink-0">
          {VISIBLE_STEPS.map((visibleStep, index) => (
            <div
              key={visibleStep}
              className={`rounded-full transition-all ${
                index === currentStepIndex
                  ? 'w-6 h-2 bg-primary'
                  : index < currentStepIndex
                    ? 'w-2 h-2 bg-primary/50'
                    : 'w-2 h-2 bg-outline-variant/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
