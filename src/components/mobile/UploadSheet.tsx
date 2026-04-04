'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { compressImageForUpload } from '@/lib/image-compression';
import { uploadToS3 } from '@/lib/image-processing';

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSheet({ isOpen, onClose }: UploadSheetProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  function handleUploadFabric() {
    onClose();
    router.push('/dashboard?tab=fabrics&upload=true');
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      // Step 1: Compress / convert the image client-side
      const { blob, contentType, originalSize, compressedSize } =
        await compressImageForUpload(file);

      // Step 2: Request a presigned upload URL from the API
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

      // Step 3: Upload the compressed blob to S3
      await uploadToS3(uploadUrl, blob, contentType);

      // Step 4: Navigate to the fabrics tab with the uploaded URL
      onClose();
      router.push(`/dashboard?tab=fabrics&uploaded=${encodeURIComponent(publicUrl)}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be selected again
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
