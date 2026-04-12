'use client';

import { useCallback, useEffect } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import { usePhotoToDesign } from '@/hooks/usePhotoToDesign';
import { UploadStep } from './UploadStep';
import { PerspectiveStep } from './PerspectiveStep';
import { GridCalibrationStep } from './GridCalibrationStep';
import { ReviewCanvas } from './ReviewCanvas';

/**
 * PhotoToDesignWizard — step container for the photo-to-design flow.
 *
 * Steps: upload → perspective → grid → review
 */
export function PhotoToDesignWizard() {
  const step = usePhotoDesignStore((s) => s.step);
  const correctedImageData = usePhotoDesignStore((s) => s.correctedImageData);
  const gridSpec = usePhotoDesignStore((s) => s.gridSpec);
  const reset = usePhotoDesignStore((s) => s.reset);

  const { process } = usePhotoToDesign();

  // When entering 'review' step with grid spec set, fire the engine
  useEffect(() => {
    if (step === 'review' && correctedImageData && gridSpec) {
      process(correctedImageData);
    }
  }, [step, correctedImageData, gridSpec, process]);

  const stepLabels = {
    upload: 'Upload',
    perspective: 'Crop',
    grid: 'Calibrate',
    review: 'Review',
  };

  const stepKeys: Array<keyof typeof stepLabels> = ['upload', 'perspective', 'grid', 'review'];
  const currentIdx = stepKeys.indexOf(step as keyof typeof stepLabels);

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg)]">
      {/* Top nav with step progress */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--color-border)]/20 bg-[var(--color-surface)]">
        <div className="flex items-center gap-3">
          <h1 className="text-[16px] leading-[24px] font-semibold text-[var(--color-text)]">
            Photo to Design
          </h1>
          <span className="text-[13px] text-[var(--color-text-dim)]">
            — {stepLabels[step as keyof typeof stepLabels] ?? step}
          </span>
        </div>

        {/* Step progress dots */}
        <div className="flex items-center gap-1.5">
          {stepKeys.map((key, i) => (
            <div key={key} className="flex items-center gap-1.5">
              {i > 0 && <div className="w-4 h-px bg-[var(--color-border)]" />}
              <div
                className={`w-2 h-2 rounded-full transition-colors duration-150 ${
                  i <= currentIdx ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                }`}
                title={stepLabels[key]}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={reset}
          className="text-[13px] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150"
        >
          Start Over
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {step === 'upload' && <UploadStep />}
        {step === 'perspective' && <PerspectiveStep />}
        {step === 'grid' && <GridCalibrationStep />}
        {step === 'review' && <ReviewCanvas />}
      </div>
    </div>
  );
}
