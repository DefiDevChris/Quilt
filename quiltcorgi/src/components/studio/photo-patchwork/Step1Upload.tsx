'use client';

import { useCallback, useRef, useState } from 'react';
import type { StepProps } from '@/types/wizard';
import type { PatchworkWizardData } from '../PhotoPatchworkDialog';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/constants';

const ACCEPTED_TYPES_SET = new Set<string>(ACCEPTED_IMAGE_TYPES);

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES_SET.has(file.type)) {
    return 'Please upload a PNG, JPEG, or WebP image.';
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Image must be under 10 MB.';
  }
  return null;
}

function loadImageData(
  file: File
): Promise<{
  readonly imageData: { width: number; height: number; data: Uint8ClampedArray };
  readonly previewUrl: string;
}> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      resolve({
        imageData: {
          width: imageData.width,
          height: imageData.height,
          data: imageData.data,
        },
        previewUrl: url,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function Step1Upload({
  data,
  onUpdate,
}: StepProps<PatchworkWizardData>) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const result = await loadImageData(file);
        onUpdate({
          imageData: result.imageData,
          imagePreviewUrl: result.previewUrl,
        });
      } catch {
        setError('Failed to process image. Please try another file.');
      } finally {
        setLoading(false);
      }
    },
    [onUpdate]
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

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-outline-variant/30 hover:border-primary/50'
        }`}
      >
        {loading ? (
          <p className="text-sm text-secondary">Processing image...</p>
        ) : (
          <>
            <p className="text-sm font-medium text-on-surface">
              Drop an image here or click to browse
            </p>
            <p className="mt-1 text-xs text-secondary">
              PNG, JPEG, or WebP up to 10 MB
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

      {/* Error message */}
      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {/* Preview */}
      {data.imagePreviewUrl && (
        <div className="flex justify-center rounded-lg border border-outline-variant/20 bg-surface-container p-2">
          <img
            src={data.imagePreviewUrl}
            alt="Uploaded photo preview"
            className="max-h-[240px] rounded object-contain"
          />
        </div>
      )}
    </div>
  );
}
