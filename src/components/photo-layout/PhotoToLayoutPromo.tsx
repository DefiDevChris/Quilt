'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';
import { QuiltPiece, QuiltPieceRow } from '@/components/decorative/QuiltPiece';
import {
  ACCEPTED_IMAGE_TYPES,
  PHOTO_PATTERN_MAX_FILE_SIZE,
  PHOTO_PATTERN_MIN_DIMENSION,
} from '@/lib/constants';
import type { MobileUpload } from '@/types/mobile-upload';

interface PhotoToDesignPromoProps {
  isPro: boolean;
  onClose: () => void;
  /** Pre-loaded image URL (from mobile uploads). Skips the upload step. */
  preloadedImageUrl?: string;
}

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

type Mode = 'pick-source' | 'mobile-uploads' | 'upload' | 'processing';

export function PhotoToDesignPromo({ isPro: _isPro, onClose, preloadedImageUrl }: PhotoToDesignPromoProps) {
  const [mode, setMode] = useState<Mode>(preloadedImageUrl ? 'processing' : 'pick-source');
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const setOriginalImage = usePhotoLayoutStore((s) => s.setOriginalImage);
  const setStep = usePhotoLayoutStore((s) => s.setStep);

  const uploads = useMobileUploadStore((s) => s.uploads);
  const fetchUploads = useMobileUploadStore((s) => s.fetchUploads);
  const isLoadingUploads = useMobileUploadStore((s) => s.isLoading);
  const processUpload = useMobileUploadStore((s) => s.processUpload);

  // Fetch pending mobile uploads when showing the mobile uploads list
  useEffect(() => {
    if (mode === 'mobile-uploads') {
      fetchUploads('pending');
    }
  }, [mode, fetchUploads]);

  // Handle preloaded image URL (from mobile uploads processed via dashboard)
  const [imageLoading, setImageLoading] = useState(
    () => !!preloadedImageUrl && mode === 'processing'
  );

  useEffect(() => {
    if (!preloadedImageUrl || mode !== 'processing') return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setOriginalImage(img, preloadedImageUrl);
      setStep('imagePrep');
      setImageLoading(false);
      onClose();
    };
    img.onerror = () => {
      setError('Failed to load image from URL.');
      setImageLoading(false);
    };
    img.src = preloadedImageUrl;
  }, [preloadedImageUrl, mode, setOriginalImage, setStep, onClose]);

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
        setStep('imagePrep');
        setLoading(false);
        onClose();
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError('Failed to load image. Please try another file.');
        setLoading(false);
      };

      img.src = url;
    },
    [setOriginalImage, setStep, onClose]
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

  const handleMobileUploadSelect = useCallback(
    async (upload: MobileUpload) => {
      setLoading(true);
      const result = await processUpload(upload.id, 'quilt');
      if (result) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setOriginalImage(img, upload.imageUrl);
          setStep('imagePrep');
          setLoading(false);
          onClose();
        };
        img.onerror = () => {
          setError('Failed to load image from mobile upload.');
          setLoading(false);
        };
        img.src = upload.imageUrl;
      } else {
        setError('Failed to process upload. Please try again.');
        setLoading(false);
      }
    },
    [processUpload, setOriginalImage, setStep, onClose]
  );

  const pendingUploads = uploads.filter((u) => u.status === 'pending');

  if (mode === 'processing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d2a26]/50">
        <div className="bg-[#ffffff] border border-[#e8e1da] rounded-xl p-8 flex flex-col items-center gap-4 max-w-sm shadow-[0_1px_2px_rgba(45,42,38,0.08)] relative overflow-hidden">
          {/* Decorative quilt pieces */}
          <div className="absolute -top-4 -right-4 opacity-10 pointer-events-none">
            <QuiltPiece color="primary" size={60} rotation={12} stitch={false} />
          </div>
          <div className="absolute -bottom-4 -left-4 opacity-10 pointer-events-none">
            <QuiltPiece color="secondary" size={50} rotation={-8} stitch={false} />
          </div>
          <div className="w-12 h-12 rounded-full bg-[#ff8d49]/10 flex items-center justify-center animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#ff8d49]">
              <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="4 3" />
            </svg>
          </div>
          <p className="text-body-md text-[#6b655e]">Loading image...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d2a26]/50">
      <div className="bg-[#ffffff] border border-[#e8e1da] rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-[0_1px_2px_rgba(45,42,38,0.08)] relative overflow-hidden">
        {/* Quilt-piece accent strip at top */}
        <div className="h-2 bg-gradient-to-r from-[#ff8d49]/20 via-[#ffc8a6]/20 to-[#ffc7c7]/20" />

        {/* Decorative quilt pieces in background */}
        <div className="absolute -top-6 -right-6 opacity-8 pointer-events-none">
          <QuiltPiece color="primary" size={100} rotation={15} stitch={false} />
        </div>
        <div className="absolute bottom-8 -left-4 opacity-6 pointer-events-none">
          <QuiltPiece color="accent" size={80} rotation={-12} stitch={false} />
        </div>

        <div className="p-6 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <QuiltPieceRow count={2} size={8} gap={3} />
              <h2 className="text-headline-sm font-semibold text-[#2d2a26]">Photo to Design</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b655e] hover:bg-[#fdfaf7] transition-colors duration-150"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M4 4L12 12M12 4L4 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Pick source mode */}
          {mode === 'pick-source' && (
            <div className="space-y-4">
              <p className="text-body-md text-[#6b655e]">
                Extract quilt pieces from a photo using AI. Choose a source:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* Upload from Computer */}
                <button
                  type="button"
                  onClick={() => setMode('upload')}
                  className="bg-[#ffffff] border border-[#e8e1da] rounded-xl p-4 flex items-center gap-4 text-left hover:bg-[#fdfaf7] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)] transition-colors duration-150 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#ff8d49]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ff8d49]/20 transition-colors duration-150">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#ff8d49]">
                      <path
                        d="M12 4V16M12 4L8 8M12 4L16 8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 14V18C4 19.1046 4.89543 20 6 20H18C19.1046 20 20 19.1046 20 18V14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-body-md font-medium text-[#2d2a26]">Upload from Computer</p>
                    <p className="text-body-sm text-[#6b655e]">Select a photo from your device</p>
                  </div>
                </button>

                {/* Choose from Mobile Uploads */}
                <button
                  type="button"
                  onClick={() => setMode('mobile-uploads')}
                  className="bg-[#ffffff] border border-[#e8e1da] rounded-xl p-4 flex items-center gap-4 text-left hover:bg-[#fdfaf7] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)] transition-colors duration-150 group"
                >
                  <div className="w-12 h-12 rounded-full bg-[#ff8d49]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#ff8d49]/20 transition-colors duration-150">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#ff8d49]">
                      <rect x="6" y="2" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="2" />
                      <path d="M12 18H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      <path
                        d="M9 6L12 9L15 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-body-md font-medium text-[#2d2a26]">Choose from Mobile Uploads</p>
                    <p className="text-body-sm text-[#6b655e]">
                      {pendingUploads.length > 0
                        ? `${pendingUploads.length} photo${pendingUploads.length > 1 ? 's' : ''} waiting`
                        : 'No uploads yet'}
                    </p>
                  </div>
                  {pendingUploads.length > 0 && (
                    <span className="w-7 h-7 rounded-lg bg-[#ff8d49] text-[#2d2a26] text-xs font-semibold flex items-center justify-center">
                      {pendingUploads.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mobile uploads list */}
          {mode === 'mobile-uploads' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setMode('pick-source')}
                className="flex items-center gap-2 text-body-sm text-[#6b655e] hover:text-[#2d2a26] transition-colors duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 4L6 8L10 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>

              {isLoadingUploads ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-[#ffffff] border border-[#e8e1da] rounded-xl overflow-hidden">
                      <div className="aspect-square bg-[#ff8d49]/20 animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : pendingUploads.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-[#ff8d49]/10 flex items-center justify-center mb-3">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6b655e"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="6" y="2" width="12" height="20" rx="2" />
                      <line x1="12" y1="18" x2="12" y2="18.01" />
                    </svg>
                  </div>
                  <p className="text-body-md font-medium text-[#2d2a26] mb-1">No uploads waiting</p>
                  <p className="text-body-sm text-[#6b655e] max-w-xs">
                    Take photos on your phone and they&apos;ll appear here for processing.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {pendingUploads.map((upload) => (
                    <button
                      key={upload.id}
                      type="button"
                      onClick={() => handleMobileUploadSelect(upload)}
                      className="bg-[#ffffff] border border-[#e8e1da] rounded-xl overflow-hidden hover:bg-[#fdfaf7] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)] transition-colors duration-150 group text-left"
                    >
                      <div className="aspect-square bg-[#fdfaf7] overflow-hidden">
                        <img
                          src={upload.imageUrl}
                          alt={upload.originalFilename || 'Mobile upload'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-label-sm font-medium text-[#2d2a26] truncate">
                          {upload.originalFilename || 'Untitled'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upload from computer */}
          {mode === 'upload' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setMode('pick-source')}
                className="flex items-center gap-2 text-body-sm text-[#6b655e] hover:text-[#2d2a26] transition-colors duration-150"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M10 4L6 8L10 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>

              {/* Drop zone */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-150 cursor-pointer relative overflow-hidden ${isDragOver
                  ? 'border-[#ff8d49] bg-[#ff8d49]/5'
                  : 'border-[#e8e1da]/50 hover:border-[#ff8d49]/50'
                  }`}
              >
                {/* Subtle quilt-piece decoration */}
                <div className="absolute top-2 right-2 opacity-8 pointer-events-none">
                  <QuiltPiece color="primary" size={50} rotation={10} stitch={false} />
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(',')}
                  onChange={handleFileChange}
                  className="hidden"
                />
                {loading ? (
                  <p className="text-body-md text-[#6b655e]">Processing image...</p>
                ) : (
                  <>
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 40 40"
                      fill="none"
                      className="mx-auto mb-3 text-[#6b655e]"
                    >
                      <path
                        d="M20 6V24M20 6L14 12M20 6L26 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M8 22V28C8 29.6569 9.34315 31 11 31H29C30.6569 31 32 29.6569 32 28V22"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <p className="text-body-md font-medium text-[#2d2a26]">Drop your quilt photo here</p>
                    <p className="mt-1 text-body-sm text-[#6b655e]">or click to browse</p>
                    <p className="mt-2 text-label-sm text-[#6b655e]">PNG, JPEG, or WebP up to 20 MB</p>
                  </>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="px-4 py-3 rounded-xl bg-[#ff8d49]/10 border border-[#ff8d49]/20">
                  <p className="text-body-sm text-[#ff8d49]">{error}</p>
                </div>
              )}

              {/* Warning */}
              {warning && (
                <div className="px-4 py-3 rounded-xl bg-[#ffc8a6]/20 border border-[#ffc8a6]/40">
                  <p className="text-body-sm text-[#6b655e]">{warning}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use PhotoToDesignPromo */
export const PhotoToLayoutPromo = PhotoToDesignPromo;
