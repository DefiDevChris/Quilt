'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, ImagePlus } from 'lucide-react';
import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';

export default function WizardStepUpload() {
  const setPendingFile = usePhotoToQuiltStore((s) => s.setPendingFile);
  const setWizardStep = usePhotoToQuiltStore((s) => s.setWizardStep);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) return;
      setPendingFile(file);
      setWizardStep('background');
    },
    [setPendingFile, setWizardStep],
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  return (
    <div
      className="flex-1 min-h-0 flex items-center justify-center bg-[var(--color-bg)]"
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      <div
        className={`flex flex-col items-center justify-center gap-4 p-12 rounded-lg border-2 border-dashed transition-colors duration-150 cursor-pointer max-w-md w-full ${
          isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-secondary)]'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)]'
        }`}
        onClick={() => fileRef.current?.click()}
      >
        <div className="grid place-items-center w-16 h-16 rounded-full bg-[var(--color-secondary)]">
          <ImagePlus size={32} className="text-[var(--color-primary)]" />
        </div>
        <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-[var(--color-text)]">
          {isDragging ? 'Drop your photo' : 'Upload a Photo'}
        </h2>
        <p className="text-sm text-[var(--color-text-dim)] text-center max-w-xs leading-relaxed">
          Drop an image here or click to browse. We&apos;ll turn it into a quilt pattern.
        </p>
        <button type="button" className="btn-primary">
          <Upload size={16} className="inline mr-1.5" />
          Choose Photo
        </button>
      </div>
    </div>
  );
}
