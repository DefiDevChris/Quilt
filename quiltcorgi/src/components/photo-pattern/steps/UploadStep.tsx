'use client';

import { useCallback, useRef, useState } from 'react';
import { usePhotoPatternStore } from '@/stores/photoPatternStore';
import {
  ACCEPTED_IMAGE_TYPES,
  PHOTO_PATTERN_MAX_FILE_SIZE,
  PHOTO_PATTERN_MIN_DIMENSION,
} from '@/lib/constants';

const ACCEPTED_TYPES_SET = new Set<string>(ACCEPTED_IMAGE_TYPES);

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES_SET.has(file.type)) {
    return 'Please upload a PNG, JPEG, or WebP image.';
  }
  if (file.size > PHOTO_PATTERN_MAX_FILE_SIZE) {
    return 'Image must be under 20 MB.';
  }
  return null;
}

export function UploadStep() {
  const originalImageUrl = usePhotoPatternStore((s) => s.originalImageUrl);
  const setOriginalImage = usePhotoPatternStore((s) => s.setOriginalImage);
  const setStep = usePhotoPatternStore((s) => s.setStep);

  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setWarning(null);
      setLoading(true);

      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        if (
          img.naturalWidth < PHOTO_PATTERN_MIN_DIMENSION ||
          img.naturalHeight < PHOTO_PATTERN_MIN_DIMENSION
        ) {
          setWarning(
            `Image is quite small (${img.naturalWidth}\u00d7${img.naturalHeight}px). Results may be limited — we recommend at least ${PHOTO_PATTERN_MIN_DIMENSION}px on each side.`
          );
        }

        setOriginalImage(img, url);
        setLoading(false);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError('Failed to load image. Please try another file.');
        setLoading(false);
      };

      img.src = url;
    },
    [setOriginalImage]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleContinue = useCallback(() => {
    setStep('correction');
  }, [setStep]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-outline-variant/30 hover:border-primary/50'
        }`}
      >
        {loading ? (
          <p className="text-body-md text-secondary">Processing image...</p>
        ) : (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
              className="mx-auto mb-3 text-secondary"
            >
              <path
                d="M24 6L24 30M24 6L16 14M24 6L32 14"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 28V36C8 38.2091 9.79086 40 12 40H36C38.2091 40 40 38.2091 40 36V28"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="text-body-lg font-medium text-on-surface">
              Drop your quilt photo here
            </p>
            <p className="mt-1 text-body-sm text-secondary">
              or click to browse
            </p>
            <p className="mt-2 text-label-sm text-secondary">
              PNG, JPEG, or WebP up to 20 MB
            </p>
          </>
        )}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Error */}
      {error && (
        <p className="text-body-sm text-error">{error}</p>
      )}

      {/* Warning */}
      {warning && (
        <p className="text-body-sm text-warning">{warning}</p>
      )}

      {/* Preview */}
      {originalImageUrl && (
        <div className="flex-1 min-h-0 flex flex-col gap-4">
          <div className="flex-1 min-h-0 flex justify-center items-center rounded-lg border border-outline-variant/20 bg-surface-container p-2">
            <img
              src={originalImageUrl}
              alt="Uploaded quilt photo preview"
              className="max-h-full max-w-full rounded-md object-contain"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleContinue}
              className="px-6 py-2.5 text-body-md font-medium text-on-primary bg-primary rounded-lg hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
