'use client';

import type { StepProps } from '@/types/wizard';
import type { OcrWizardData } from '@/components/studio/QuiltPhotoImportWizard';
import { computeMeasurements } from '@/lib/ocr/measurement';

export function Step5Measurements({
  data,
  onUpdate,
}: StepProps<OcrWizardData>) {
  function handleReferenceChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = parseFloat(e.target.value);
    if (isNaN(value) || value <= 0) return;

    const newMeasurements =
      data.grid && data.imageData
        ? computeMeasurements(data.grid, value, data.imageData.width)
        : null;

    onUpdate({
      referenceWidthInches: value,
      measurements: newMeasurements,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <label
          htmlFor="reference-width"
          className="block text-body-sm font-medium text-on-surface mb-2"
        >
          Quilt width (inches)
        </label>
        <p className="text-body-sm text-secondary mb-3">
          Enter a known measurement to scale all dimensions accurately.
        </p>
        <div className="flex items-center gap-2">
          <input
            id="reference-width"
            type="number"
            min="1"
            max="200"
            step="0.25"
            value={data.referenceWidthInches}
            onChange={handleReferenceChange}
            className="w-24 bg-surface-container rounded-sm h-9 px-3 font-mono text-sm text-on-surface border border-outline-variant/20"
          />
          <span className="text-body-sm text-secondary">inches</span>
        </div>
      </div>

      {data.measurements && (
        <div className="bg-surface-container rounded-lg p-4 space-y-3">
          <h4 className="text-label-sm uppercase text-secondary tracking-wider font-medium">
            Calculated Dimensions
          </h4>
          <div className="grid grid-cols-2 gap-3 text-body-sm">
            <div>
              <span className="text-secondary">Total Width:</span>{' '}
              <span className="font-medium text-on-surface">
                {data.measurements.totalWidthInches}&quot;
              </span>
            </div>
            <div>
              <span className="text-secondary">Total Height:</span>{' '}
              <span className="font-medium text-on-surface">
                {data.measurements.totalHeightInches}&quot;
              </span>
            </div>
            <div>
              <span className="text-secondary">Block Size:</span>{' '}
              <span className="font-medium text-on-surface">
                {data.measurements.blockSizeInches}&quot;
              </span>
            </div>
            <div>
              <span className="text-secondary">Seam Allowance:</span>{' '}
              <span className="font-medium text-on-surface">
                {data.measurements.seamAllowanceInches}&quot;
              </span>
            </div>
            {data.measurements.sashingWidthInches > 0 && (
              <div>
                <span className="text-secondary">Sashing:</span>{' '}
                <span className="font-medium text-on-surface">
                  {data.measurements.sashingWidthInches}&quot;
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
