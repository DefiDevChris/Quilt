'use client';

import type { StepProps } from '@/types/wizard';
import type { OcrWizardData } from '@/components/studio/QuiltPhotoImportWizard';

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return 'text-success';
  if (confidence >= 0.3) return 'text-warning';
  return 'text-error';
}

function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.7) return 'High';
  if (confidence >= 0.3) return 'Medium';
  return 'Low';
}

export function Step4Blocks({ data }: StepProps<OcrWizardData>) {
  const { blocks } = data;

  if (blocks.length === 0) {
    return (
      <div className="py-8 text-center text-secondary">
        No blocks were detected in the image.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-body-sm text-secondary">
        {blocks.length} block{blocks.length !== 1 ? 's' : ''} detected. Review
        the matches below.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
        {blocks.map((block) => (
          <div
            key={`${block.row}-${block.col}`}
            className="bg-surface-container rounded-md p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-label-sm text-secondary">
                ({block.row}, {block.col})
              </span>
              <span
                className={`text-label-sm font-medium ${getConfidenceColor(block.confidence)}`}
              >
                {getConfidenceLabel(block.confidence)}
              </span>
            </div>

            {block.bestMatch ? (
              <div>
                <p className="text-body-sm font-medium text-on-surface truncate">
                  {block.bestMatch.blockName}
                </p>
                <p className="text-label-sm text-secondary">
                  {block.bestMatch.category} &middot;{' '}
                  {Math.round(block.bestMatch.similarity * 100)}%
                </p>
              </div>
            ) : (
              <p className="text-body-sm text-secondary italic">
                No match found
              </p>
            )}

            {block.matches.length > 1 && (
              <details className="mt-2">
                <summary className="text-label-sm text-primary cursor-pointer">
                  {block.matches.length - 1} alternatives
                </summary>
                <div className="mt-1 space-y-1">
                  {block.matches.slice(1).map((match) => (
                    <p
                      key={match.blockId}
                      className="text-label-sm text-secondary"
                    >
                      {match.blockName} ({Math.round(match.similarity * 100)}%)
                    </p>
                  ))}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
