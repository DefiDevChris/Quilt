'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImageForUpload } from '@/lib/image-compression';
import { uploadToS3 } from '@/lib/image-processing';
import { useAuthStore } from '@/stores/authStore';

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSheet({ isOpen, onClose }: UploadSheetProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const isPro = useAuthStore((s) => s.isPro);

  if (!isOpen) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      const { blob, contentType } = await compressImageForUpload(file);

      const presignedRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name.replace(/\.[^.]+$/, '') + '.webp',
          contentType,
          purpose: 'fabric',
        }),
      });

      if (!presignedRes.ok) {
        const errBody = await presignedRes.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server returned ${presignedRes.status}`);
      }

      const presignedData = await presignedRes.json();
      const { uploadUrl, publicUrl } = presignedData.data;

      await uploadToS3(uploadUrl, blob, contentType);

      onClose();
      router.push(`/dashboard?tab=fabrics&uploaded=${encodeURIComponent(publicUrl)}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleUploadBlock() {
    onClose();
    router.push('/dashboard?tab=blocks&upload=true');
  }

  function handlePhotoToQuilt() {
    onClose();
    if (isPro) {
      router.push('/dashboard?action=photo-to-pattern');
    } else {
      router.push('/dashboard?upgrade=photo-to-pattern');
    }
  }

  function handleShareToSocial() {
    onClose();
    router.push('/socialthreads?compose=true');
  }

  return (
    <>
      <div
        data-testid="upload-sheet-backdrop"
        className="fixed inset-0 z-50 bg-on-surface/20"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl pb-10 pt-3 shadow-elevation-4">
        <div className="w-10 h-1 rounded-full bg-outline-variant mx-auto mb-6" />
        <div className="px-6 space-y-3">
          {/* Upload Fabric */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container transition-colors text-left disabled:opacity-50"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary-golden-glow)' }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary-golden)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">
                {uploading ? 'Uploading…' : 'Upload Fabric'}
              </p>
              <p className="text-xs text-secondary mt-0.5">Add a fabric photo to your library</p>
            </div>
          </button>

          {/* Upload Block */}
          <button
            type="button"
            onClick={handleUploadBlock}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container transition-colors text-left"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary-golden-glow)' }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary-golden)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="8" height="8" rx="1" />
                <rect x="13" y="3" width="8" height="8" rx="1" />
                <rect x="3" y="13" width="8" height="8" rx="1" />
                <rect x="13" y="13" width="8" height="8" rx="1" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Upload Block</p>
              <p className="text-xs text-secondary mt-0.5">
                Photograph a quilt block to add to your collection
              </p>
            </div>
          </button>

          {/* Photo to Quilt */}
          <button
            type="button"
            onClick={handlePhotoToQuilt}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container transition-colors text-left"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary-golden-glow)' }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary-golden)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Photo to Quilt</p>
              <p className="text-xs text-secondary mt-0.5">
                {isPro
                  ? 'Turn a photo into a quilt pattern'
                  : 'Turn a photo into a quilt pattern (Pro)'}
              </p>
            </div>
          </button>

          {/* Share to Social */}
          <button
            type="button"
            onClick={handleShareToSocial}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container transition-colors text-left"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary-golden-glow)' }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--color-primary-golden)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Share to Social</p>
              <p className="text-xs text-secondary mt-0.5">Post a quilt photo with your story</p>
            </div>
          </button>
        </div>

        {/* Upload error */}
        {uploadError && (
          <div className="px-6 mt-3">
            <p className="text-xs text-error">{uploadError}</p>
          </div>
        )}

        {/* Hidden file input for fabric photos */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
          aria-label="Upload fabric photo"
        />
      </div>
    </>
  );
}
