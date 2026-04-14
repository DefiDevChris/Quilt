'use client';

import { useCallback, useRef, useState } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 4000;

/**
 * Step 1: Upload — drag-drop or file picker for a quilt photo.
 */
export function UploadStep() {
  const setSourceImage = usePhotoDesignStore((s) => s.setSourceImage);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      // HEIC conversion
      let blob: Blob = file;
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'heic' || ext === 'heif' || file.type.includes('heic')) {
        try {
          const heic2any = (await import('heic2any')).default;
          const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
          blob = Array.isArray(converted) ? converted[0] : converted;
        } catch {
          setError('Could not convert HEIC image. Try a JPEG or PNG instead.');
          return;
        }
      } else if (!ACCEPTED_TYPES.includes(file.type)) {
        setError('Please upload a JPEG, PNG, or WebP image.');
        return;
      }

      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        // Downscale if too large
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          const scale = MAX_DIMENSION / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Canvas context unavailable.');
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        setSourceImage(url, imageData);
      };

      img.onerror = () => setError('Failed to load image.');
      img.src = url;
    },
    [setSourceImage]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="flex flex-col items-center justify-center gap-6 p-8 h-full">
      <h2 className="text-[24px] leading-[32px] font-semibold text-[var(--color-text)]">
        Upload a quilt photo
      </h2>
      <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)] max-w-md text-center">
        Take a straight-on photo of your quilt. The engine will trace every seam and turn each
        fabric patch into a scalable shape.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`w-full max-w-lg h-64 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors duration-150 ${
          isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
        }`}
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          className="text-[var(--color-text-dim)]"
        >
          <path
            d="M12 16V4m0 0l-4 4m4-4l4 4M4 17v2a1 1 0 001 1h14a1 1 0 001-1v-2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
          Drop a photo here or click to browse
        </span>
        <span className="text-[14px] leading-[20px] text-[var(--color-text-dim)]/60">
          JPEG, PNG, WebP, or HEIC
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && <p className="text-[14px] leading-[20px] text-red-600">{error}</p>}
    </div>
  );
}
