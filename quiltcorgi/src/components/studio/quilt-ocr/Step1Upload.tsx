'use client';

import { useCallback, useRef, useState } from 'react';
import type { StepProps } from '@/types/wizard';
import type { OcrWizardData } from '@/components/studio/QuiltPhotoImportWizard';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/constants';

export function Step1Upload({ data, onUpdate }: StepProps<OcrWizardData>) {
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    (file: File) => {
      setError('');

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type as typeof ACCEPTED_IMAGE_TYPES[number])) {
        setError('Please upload a PNG, JPEG, or WebP image');
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError('Image must be under 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, img.width, img.height);

          onUpdate({
            imageData: {
              width: imageData.width,
              height: imageData.height,
              data: imageData.data,
            },
            imagePreviewUrl: canvas.toDataURL('image/jpeg', 0.8),
          });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    },
    [onUpdate]
  );

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          isDragOver
            ? 'border-primary bg-primary-container/10'
            : 'border-outline-variant/30 hover:border-outline-variant/50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload photo of quilt"
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
        <svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          className="mx-auto mb-3 text-secondary"
        >
          <path
            d="M20 8V24M20 8L14 14M20 8L26 14M8 28H32"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="text-body-md text-on-surface font-medium">
          Drop a quilt photo here or click to browse
        </p>
        <p className="text-body-sm text-secondary mt-1">
          PNG, JPEG, or WebP up to 10MB
        </p>
      </div>

      {error && (
        <div className="bg-error/10 px-3 py-2 text-sm text-error rounded-sm">
          {error}
        </div>
      )}

      {data.imagePreviewUrl && (
        <div className="rounded-lg overflow-hidden bg-surface-container">
          <img
            src={data.imagePreviewUrl}
            alt="Uploaded quilt photo"
            className="w-full h-auto max-h-[300px] object-contain"
          />
        </div>
      )}
    </div>
  );
}
