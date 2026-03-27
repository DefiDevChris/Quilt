'use client';

import type { StepProps } from '@/types/wizard';
import type { OcrWizardData } from '@/components/studio/QuiltPhotoImportWizard';

export function Step7Preview({ data }: StepProps<OcrWizardData>) {
  const { grid, blocks, measurements, colors } = data;

  const blocksWithMatch = blocks.filter((b) => b.bestMatch !== null);
  const avgConfidence =
    blocks.length > 0
      ? blocks.reduce((sum, b) => sum + b.confidence, 0) / blocks.length
      : 0;

  const uniqueColors = new Set<string>();
  for (const bc of colors) {
    for (const c of bc.dominantColors) {
      uniqueColors.add(c.hex);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-surface-container rounded-lg p-5">
        <h4 className="text-title-md font-semibold text-on-surface mb-4">
          Reconstruction Summary
        </h4>

        <div className="grid grid-cols-2 gap-4 text-body-sm">
          {grid && (
            <>
              <div>
                <span className="text-secondary">Grid Size:</span>{' '}
                <span className="font-medium text-on-surface">
                  {grid.rows} x {grid.cols}
                </span>
              </div>
              <div>
                <span className="text-secondary">Layout:</span>{' '}
                <span className="font-medium text-on-surface capitalize">
                  {grid.layoutType}
                </span>
              </div>
            </>
          )}
          <div>
            <span className="text-secondary">Blocks Matched:</span>{' '}
            <span className="font-medium text-on-surface">
              {blocksWithMatch.length} / {blocks.length}
            </span>
          </div>
          <div>
            <span className="text-secondary">Avg. Confidence:</span>{' '}
            <span className="font-medium text-on-surface">
              {Math.round(avgConfidence * 100)}%
            </span>
          </div>
          <div>
            <span className="text-secondary">Unique Colors:</span>{' '}
            <span className="font-medium text-on-surface">
              {uniqueColors.size}
            </span>
          </div>
          {measurements && (
            <>
              <div>
                <span className="text-secondary">Dimensions:</span>{' '}
                <span className="font-medium text-on-surface">
                  {measurements.totalWidthInches}&quot; x{' '}
                  {measurements.totalHeightInches}&quot;
                </span>
              </div>
              <div>
                <span className="text-secondary">Block Size:</span>{' '}
                <span className="font-medium text-on-surface">
                  {measurements.blockSizeInches}&quot;
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Color palette preview */}
      {uniqueColors.size > 0 && (
        <div>
          <h4 className="text-label-sm uppercase text-secondary tracking-wider font-medium mb-2">
            Color Palette
          </h4>
          <div className="flex flex-wrap gap-1">
            {[...uniqueColors].slice(0, 24).map((hex) => (
              <div
                key={hex}
                className="w-6 h-6 rounded-sm border border-outline-variant/20"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
          </div>
        </div>
      )}

      <p className="text-body-sm text-secondary">
        Click &ldquo;Import to Canvas&rdquo; to create an editable quilt design
        with all detected blocks, colors, and measurements.
      </p>
    </div>
  );
}
