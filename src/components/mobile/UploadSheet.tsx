'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImageForUpload } from '@/lib/image-compression';
import { uploadToS3 } from '@/lib/image-processing';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSheet({ isOpen, onClose }: UploadSheetProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const createUpload = useMobileUploadStore((s) => s.createUpload);
  const pendingCount = useMobileUploadStore((s) => s.uploads.filter((u) => u.status === 'pending').length);

  if (!isOpen) return null;

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const { blob, contentType, compressedSize } = await compressImageForUpload(file);

      const presignedRes = await fetch('/api/upload/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name.replace(/\.[^.]+$/, '') + '.webp',
          contentType,
          purpose: 'mobile-upload',
        }),
      });

      if (!presignedRes.ok) {
        const errBody = await presignedRes.json().catch(() => ({}));
        throw new Error(errBody?.error || `Server returned ${presignedRes.status}`);
      }

      const presignedData = await presignedRes.json();
      const { uploadUrl, publicUrl } = presignedData.data;

      await uploadToS3(uploadUrl, blob, contentType);

      await createUpload(publicUrl, file.name, compressedSize);

      setUploadSuccess(true);
      setTimeout(() => {
        setUploadSuccess(false);
      }, 3000);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
          {/* Upload Photo — primary action */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary-golden/10 border border-primary/20 transition-colors text-left disabled:opacity-50"
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary-golden-glow)' }}
            >
              {uploading ? (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  className="animate-spin text-primary"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="40 20"
                  />
                </svg>
              ) : (
                <svg
                  width="22"
                  height="22"
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
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-on-surface">
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </p>
              <p className="text-xs text-secondary mt-0.5">
                Take or pick a photo — assign it on desktop
              </p>
            </div>
          </button>

          {/* Success feedback */}
          {uploadSuccess && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" className="text-success shrink-0">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M6 10L9 13L14 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs font-medium text-success">
                Uploaded! Open on desktop to assign and process.
              </p>
            </div>
          )}

          {/* Pending count */}
          {pendingCount > 0 && !uploadSuccess && (
            <p className="text-xs text-secondary text-center">
              {pendingCount} photo{pendingCount !== 1 ? 's' : ''} waiting on desktop
            </p>
          )}

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

        {/* Hidden file input for photo capture */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
          aria-label="Upload photo"
        />
      </div>
    </>
  );
}
