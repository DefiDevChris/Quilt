'use client';

import type { StepProps } from '@/types/wizard';
import type { OcrWizardData } from '@/components/studio/QuiltPhotoImportWizard';

export function Step3Grid({ data }: StepProps<OcrWizardData>) {
  const { grid, imagePreviewUrl } = data;

  if (!grid) {
    return (
      <div className="py-8 text-center text-secondary">
        No grid detected. The image may not contain a recognizable quilt pattern.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-body-sm">
        <div className="bg-surface-container rounded-md px-3 py-2">
          <span className="text-secondary">Rows:</span>{' '}
          <span className="font-medium text-on-surface">{grid.rows}</span>
        </div>
        <div className="bg-surface-container rounded-md px-3 py-2">
          <span className="text-secondary">Columns:</span>{' '}
          <span className="font-medium text-on-surface">{grid.cols}</span>
        </div>
        <div className="bg-surface-container rounded-md px-3 py-2">
          <span className="text-secondary">Layout:</span>{' '}
          <span className="font-medium text-on-surface capitalize">
            {grid.layoutType}
          </span>
        </div>
        <div className="bg-surface-container rounded-md px-3 py-2">
          <span className="text-secondary">Confidence:</span>{' '}
          <span className="font-medium text-on-surface">
            {Math.round(grid.confidence * 100)}%
          </span>
        </div>
      </div>

      {imagePreviewUrl && (
        <div className="relative rounded-lg overflow-hidden bg-surface-container">
          <img
            src={imagePreviewUrl}
            alt="Quilt with grid overlay"
            className="w-full h-auto max-h-[400px] object-contain"
          />
          {/* Grid overlay */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox={`0 0 ${grid.verticalLines[grid.verticalLines.length - 1] ?? 100} ${grid.horizontalLines[grid.horizontalLines.length - 1] ?? 100}`}
            preserveAspectRatio="none"
          >
            {grid.horizontalLines.map((y, i) => (
              <line
                key={`h-${i}`}
                x1="0"
                y1={y}
                x2={grid.verticalLines[grid.verticalLines.length - 1] ?? 100}
                y2={y}
                stroke="#8d4f00"
                strokeWidth="1"
                opacity="0.6"
              />
            ))}
            {grid.verticalLines.map((x, i) => (
              <line
                key={`v-${i}`}
                x1={x}
                y1="0"
                x2={x}
                y2={grid.horizontalLines[grid.horizontalLines.length - 1] ?? 100}
                stroke="#8d4f00"
                strokeWidth="1"
                opacity="0.6"
              />
            ))}
          </svg>
        </div>
      )}

      <p className="text-body-sm text-secondary">
        Review the detected grid. If the grid doesn&apos;t look right, adjust the
        edge detection threshold and re-analyze.
      </p>
    </div>
  );
}
