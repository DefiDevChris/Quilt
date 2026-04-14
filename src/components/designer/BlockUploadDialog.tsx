'use client';

import { useState, useCallback, useRef } from 'react';
import { BlockCropDialog } from '@/components/designer/BlockCropDialog';

interface UploadFile {
  file: File;
  name: string;
  previewUrl: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error';
  progress: number;
  uploadedUrl?: string;
  error?: string;
}

interface BlockUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (blockId?: string) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

async function uploadToS3(file: File, onProgress?: (progress: number) => void): Promise<string> {
  const filename = `block-${Date.now()}-${file.name.replace(/\s+/g, '-')}`;

  const presignRes = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename,
      contentType: file.type,
      purpose: 'block',
    }),
  });

  if (!presignRes.ok) {
    const errText = await presignRes.text().catch(() => '');
    throw new Error(`Failed to get upload URL: ${errText}`);
  }

  const { data } = await presignRes.json();

  onProgress?.(10);

  const uploadRes = await fetch(data.uploadUrl as string, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  onProgress?.(100);

  if (!uploadRes.ok) {
    throw new Error('Upload to S3 failed');
  }

  return data.publicUrl as string;
}

export function BlockUploadDialog({ isOpen, onClose, onSaved }: BlockUploadDialogProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cropImage, setCropImage] = useState<{ url: string; filename: string } | null>(null);
  const [cropBlockId, setCropBlockId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    setError(null);

    const newFiles: UploadFile[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        invalidFiles.push(file.name);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (too large)`);
        return;
      }
      newFiles.push({
        file,
        name: file.name.replace(/\.[^.]+$/, ''),
        previewUrl: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
      });
    });

    if (invalidFiles.length > 0) {
      setError(`Invalid files: ${invalidFiles.join(', ')}`);
    }

    setUploadFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadFiles((prev) => {
      const removed = prev[index];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const handleUploadAll = useCallback(async () => {
    const pendingFiles = uploadFiles.filter((f) => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    setIsUploading(true);
    setError(null);

    const results = [...uploadFiles];

    for (let i = 0; i < results.length; i++) {
      if (results[i].status !== 'pending') continue;

      results[i] = { ...results[i], status: 'uploading', progress: 0 };
      setUploadFiles([...results]);

      try {
        const uploadedUrl = await uploadToS3(results[i].file, (progress) => {
          results[i] = { ...results[i], progress };
          setUploadFiles([...results]);
        });

        results[i] = {
          ...results[i],
          status: 'uploaded',
          progress: 100,
          uploadedUrl,
        };
        setUploadFiles([...results]);
      } catch (err) {
        results[i] = {
          ...results[i],
          status: 'error',
          error: err instanceof Error ? err.message : 'Upload failed',
        };
        setUploadFiles([...results]);
      }
    }

    setIsUploading(false);

    // If only one file was uploaded successfully, open crop dialog immediately
    const uploadedCount = results.filter((f) => f.status === 'uploaded').length;
    if (uploadedCount === 1 && results.length === 1 && results[0].uploadedUrl) {
      setCropImage({ url: results[0].uploadedUrl, filename: results[0].name });
    }
  }, [uploadFiles]);

  const handleCropSaved = useCallback(
    (blockId: string) => {
      setCropImage(null);
      setCropBlockId(blockId);
      // Clear uploaded files and notify parent
      setUploadFiles([]);
      onSaved(blockId);
    },
    [onSaved]
  );

  const handleClose = useCallback(() => {
    // Clean up preview URLs
    uploadFiles.forEach((f) => {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    });
    setUploadFiles([]);
    setError(null);
    onClose();
  }, [uploadFiles, onClose]);

  if (!isOpen) return null;

  const hasPendingFiles = uploadFiles.some((f) => f.status === 'pending');
  const uploadedCount = uploadFiles.filter((f) => f.status === 'uploaded').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
        onKeyDown={(e) => e.key === 'Escape' && handleClose()}
        role="button"
        tabIndex={0}
        aria-label="Close upload dialog"
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-[var(--color-surface)] shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]/20">
          <h2 className="text-[16px] leading-[24px] font-semibold text-[var(--color-text)]">
            Upload Blocks
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {/* Upload area */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Select images to upload"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-bg)] transition-colors duration-150 mb-4"
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              stroke="var(--color-text-dim)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-2"
            >
              <path d="M16 4v16M10 14l6-6 6 6" />
              <path d="M26 22v4a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-4" />
            </svg>
            <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
              Click to select images
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-dim)]/70">
              PNG, JPEG, or WebP (max 20MB each)
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* File list */}
          {uploadFiles.length > 0 && (
            <div className="space-y-2">
              {uploadFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-border)]/20 bg-[var(--color-bg)] p-2"
                >
                  {/* Thumbnail */}
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-[var(--color-surface)]">
                    {file.previewUrl ? (
                      <img
                        src={file.previewUrl}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-text-dim)]/40">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <rect x="2" y="2" width="12" height="12" rx="1" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Name + progress */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] leading-[16px] text-[var(--color-text)] truncate">
                      {file.name}
                    </p>
                    {file.status === 'uploading' && (
                      <div className="mt-1 h-1 rounded-full bg-[var(--color-border)]/30 overflow-hidden">
                        <div
                          className="h-full bg-[var(--color-primary)] transition-all duration-200"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    )}
                    {file.status === 'uploaded' && (
                      <p className="text-[10px] leading-[14px] text-green-600">Uploaded</p>
                    )}
                    {file.status === 'error' && (
                      <p className="text-[10px] leading-[14px] text-[var(--color-primary)]">
                        {file.error}
                      </p>
                    )}
                  </div>

                  {/* Remove button */}
                  {file.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="4" y1="4" x2="12" y2="12" />
                        <line x1="12" y1="4" x2="4" y2="12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-3 text-[14px] leading-[20px] text-[var(--color-primary)]">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)]/20">
          <p className="text-[14px] leading-[20px] text-[var(--color-text-dim)]">
            {uploadedCount} uploaded
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded-full text-[14px] leading-[20px] text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150"
            >
              Cancel
            </button>
            {hasPendingFiles && (
              <button
                type="button"
                onClick={handleUploadAll}
                disabled={isUploading}
                className="px-6 py-2 rounded-full text-sm font-medium bg-[var(--color-primary)] text-[var(--color-text)] hover:bg-[var(--color-primary)]/90 transition-colors duration-150 disabled:opacity-50"
              >
                {isUploading
                  ? 'Uploading...'
                  : `Upload ${uploadFiles.filter((f) => f.status === 'pending').length} file${uploadFiles.filter((f) => f.status === 'pending').length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Crop dialog */}
      {cropImage && (
        <BlockCropDialog
          isOpen={true}
          onClose={() => setCropImage(null)}
          imageUrl={cropImage.url}
          filename={cropImage.filename}
          onSaved={handleCropSaved}
        />
      )}
    </div>
  );
}
