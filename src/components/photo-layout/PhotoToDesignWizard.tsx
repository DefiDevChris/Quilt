'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';
import { useAuthStore } from '@/stores/authStore';
import { ProUpgradeModal } from '@/components/billing/ProUpgradeModal';
import { QuiltPiece, QuiltPieceRow } from '@/components/decorative/QuiltPiece';
import {
  ACCEPTED_IMAGE_TYPES,
  PHOTO_PATTERN_MAX_FILE_SIZE,
  PHOTO_PATTERN_MIN_DIMENSION,
} from '@/lib/constants';
import { warpSourceImage, buildBlockPattern } from '@/lib/photo-layout-utils';
import { PhotoReviewStep } from '@/components/photo-layout/PhotoReviewStep';
import { CalibrationStep } from '@/components/photo-layout/CalibrationStep';
import { LayoutPickerStep } from '@/components/photo-layout/LayoutPickerStep';
import type { MobileUpload } from '@/types/mobile-upload';
import type {
  PhotoLayoutStep,
  QuadCorners,
} from '@/lib/photo-layout-types';

const ACCEPTED_TYPES_SET = new Set<string>(ACCEPTED_IMAGE_TYPES);

const STEP_LABELS = ['Upload', 'Calibrate', 'Layout', 'Review'] as const;

const STEP_KEYS: Array<PhotoLayoutStep> = [
  'upload',
  'calibrate',
  'layout',
  'review',
];

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES_SET.has(file.type)) {
    return 'Please upload a PNG, JPEG, or WebP image.';
  }
  if (file.size > PHOTO_PATTERN_MAX_FILE_SIZE) {
    return 'Image must be under 20 MB.';
  }
  return null;
}

/**
 * Top-level wizard orchestrating the perspective-first photo → pattern
 * pipeline. The four real steps are:
 *
 *   upload     — drop or pick an image
 *   calibrate  — pin four corners onto one quilt block + set real-world size
 *   layout     — pick a block grid preset; the flattened block is warped here
 *   review     — color-check each patch; swap colors; send to studio
 *
 * State is split between this component (ephemeral UI flags) and the
 * `photoLayoutStore` (durable geometry + warped image). `usePhotoPatternImport`
 * reads the store after the studio mounts and drops the polygons onto the
 * canvas.
 */
export function PhotoToDesignWizard({ preloadedImageUrl }: { preloadedImageUrl?: string }) {
  const router = useRouter();
  const isPro = useAuthStore((s) => s.isPro);
  const isLoadingAuth = useAuthStore((s) => s.isLoading);
  const [showProUpgrade, setShowProUpgrade] = useState(false);

  const step = usePhotoLayoutStore((s) => s.step);
  const setStep = usePhotoLayoutStore((s) => s.setStep);
  const setOriginalImage = usePhotoLayoutStore((s) => s.setOriginalImage);
  const originalImage = usePhotoLayoutStore((s) => s.originalImage);
  const originalImageUrl = usePhotoLayoutStore((s) => s.originalImageUrl);

  const corners = usePhotoLayoutStore((s) => s.corners);
  const setCorners = usePhotoLayoutStore((s) => s.setCorners);
  const blockWidthInches = usePhotoLayoutStore((s) => s.blockWidthInches);
  const blockHeightInches = usePhotoLayoutStore((s) => s.blockHeightInches);
  const setBlockSize = usePhotoLayoutStore((s) => s.setBlockSize);

  const warpedImageRef = usePhotoLayoutStore((s) => s.warpedImageRef);
  const setWarpedImageRef = usePhotoLayoutStore((s) => s.setWarpedImageRef);

  const selectedPreset = usePhotoLayoutStore((s) => s.selectedPreset);
  const setSelectedPreset = usePhotoLayoutStore((s) => s.setSelectedPreset);

  const cells = usePhotoLayoutStore((s) => s.cells);
  const setCells = usePhotoLayoutStore((s) => s.setCells);
  const updateCellColor = usePhotoLayoutStore((s) => s.updateCellColor);

  const reset = usePhotoLayoutStore((s) => s.reset);

  // Warped bitmap kept in a ref — too large for Zustand, but needed to
  // re-sample colors whenever the user swaps presets on the layout step.
  const warpedBitmapRef = useRef<ImageData | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [warping, setWarping] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const uploads = useMobileUploadStore((s) => s.uploads);
  const fetchUploads = useMobileUploadStore((s) => s.fetchUploads);
  const processUpload = useMobileUploadStore((s) => s.processUpload);
  const pendingUploads = uploads.filter((u) => u.status === 'pending');

  const currentStepIndex = STEP_KEYS.indexOf(step as (typeof STEP_KEYS)[number]);

  // Handle preloaded image URL
  useEffect(() => {
    if (preloadedImageUrl && !originalImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setOriginalImage(img, preloadedImageUrl);
        setStep('calibrate');
      };
      img.onerror = () => {
        setError('Failed to load image from URL.');
      };
      img.src = preloadedImageUrl;
    }
  }, [preloadedImageUrl, originalImage, setOriginalImage, setStep]);

  // Fetch mobile uploads when on upload step
  useEffect(() => {
    if (step === 'upload') {
      fetchUploads('pending');
    }
  }, [step, fetchUploads]);

  // Re-sample grid cells whenever the user changes presets on the layout
  // step. We keep the warped ImageData in a ref so this is cheap — no extra
  // fetches, no re-warp.
  useEffect(() => {
    if (step !== 'layout') return;
    if (!warpedBitmapRef.current) return;
    const result = buildBlockPattern(
      selectedPreset,
      blockWidthInches,
      blockHeightInches,
      warpedBitmapRef.current
    );
    setCells(result.cells);
  }, [step, selectedPreset, blockWidthInches, blockHeightInches, setCells]);

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

  const handleMobileUploadSelect = useCallback(
    async (upload: MobileUpload) => {
      setLoading(true);
      const result = await processUpload(upload.id, 'quilt');
      if (result) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          setOriginalImage(img, upload.imageUrl);
          setLoading(false);
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
    [processUpload, setOriginalImage]
  );

  /**
   * Advance past the upload step. Gated on pro access so we don't do the
   * expensive warp for free users.
   */
  const handleContinueFromUpload = useCallback(() => {
    if (!isPro && !isLoadingAuth) {
      setShowProUpgrade(true);
      return;
    }
    setStep('calibrate');
  }, [isPro, isLoadingAuth, setStep]);

  /**
   * Calibration → Layout: take the pinned corners, warp the source into a
   * flat block bitmap, stash both the Blob URL (in the store) and the raw
   * ImageData (in a ref) for downstream color sampling.
   */
  const handleCalibrationContinue = useCallback(
    async (nextCorners: QuadCorners, widthInches: number, heightInches: number) => {
      if (!originalImage) return;
      setError(null);
      setWarping(true);
      try {
        setCorners(nextCorners);
        setBlockSize(widthInches, heightInches);

        const result = await warpSourceImage(originalImage, {
          corners: nextCorners,
          widthInches,
          heightInches,
        });
        if (!result) {
          setError(
            'Could not flatten that block — double-check the four corners and try again.'
          );
          setWarping(false);
          return;
        }

        warpedBitmapRef.current = result.warped;
        setWarpedImageRef(result.warpedRef);

        // Sample colors with the current preset so the layout step can
        // render an immediate preview instead of showing empty cells.
        const pattern = buildBlockPattern(
          selectedPreset,
          widthInches,
          heightInches,
          result.warped
        );
        setCells(pattern.cells);
        setStep('layout');
      } catch (err) {
        console.error('[PhotoToDesignWizard] warp failed:', err);
        setError('Something went wrong while flattening the block. Please try again.');
      } finally {
        setWarping(false);
      }
    },
    [
      originalImage,
      setCorners,
      setBlockSize,
      setWarpedImageRef,
      selectedPreset,
      setCells,
      setStep,
    ]
  );

  const handleLayoutContinue = useCallback(() => {
    setStep('review');
  }, [setStep]);

  const handleClose = () => {
    reset();
    warpedBitmapRef.current = null;
    router.push('/dashboard');
  };

  /**
   * Create a new project sized to match the calibrated block, then navigate
   * to it. The grid cells stay in `photoLayoutStore` — when the studio
   * mounts, `usePhotoPatternImport` picks them up, drops the polygons on the
   * canvas, and calls `reset()` itself to clear the store.
   */
  const handleOpenInStudio = async () => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Photo Pattern',
          unitSystem: 'imperial',
          canvasWidth: blockWidthInches,
          canvasHeight: blockHeightInches,
          gridSettings: { enabled: true, size: 1, snapToGrid: true },
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent('/photo-to-design')}`;
          return;
        }
        setError('Failed to create project. Please try again.');
        return;
      }

      const data = (await res.json()) as { data?: { id?: string } };
      const newId = data?.data?.id;
      if (!newId) {
        setError('Server returned no project id');
        return;
      }

      // Suppress the first-visit New Quilt setup modal — the studio would
      // otherwise see an empty canvas before usePhotoPatternImport runs and
      // pop the wizard over our detected pieces.
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(`qc-quilt-setup-shown-${newId}`, '1');
      }

      router.push(`/studio/${newId}`);
    } catch {
      setError('Failed to create project. Please try again.');
    }
  };

  if (showProUpgrade) {
    return <ProUpgradeModal onClose={() => setShowProUpgrade(false)} />;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col relative overflow-hidden">
      {/* Decorative quilt-piece backgrounds — massive, very spread, high opacity, charcoal stitches, flush */}
      <QuiltPiece
        color="primary"
        size={900}
        rotation={0}
        top={-350}
        left={-350}
        opacity={35}
        strokeWidth={5}
        stitchGap={16}
        stitchColor="var(--color-text)"
      />
      <QuiltPiece
        color="secondary"
        size={800}
        rotation={0}
        bottom={-300}
        right={-200}
        opacity={30}
        strokeWidth={5}
        stitchGap={16}
        stitchColor="var(--color-text)"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] relative z-10">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-2 text-body-sm text-[var(--color-text-dim)] hover:text-[#ff8d49] transition-colors duration-150"
          aria-label="Close"
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
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <QuiltPieceRow count={3} size={10} gap={4} />
          <h2 className="text-headline-sm font-semibold text-[var(--color-text)]">Photo to Design</h2>
          <QuiltPieceRow count={3} size={10} gap={4} colors={['accent', 'secondary', 'primary']} />
        </div>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto px-6 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div
            data-testid="photo-pattern-wizard"
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-[0_1px_2px_rgba(26,26,26,0.08)] relative overflow-hidden"
          >
            {/* Quilt-piece accent strip at top of card */}
            <div className="h-2 bg-[var(--color-bg)]" />

            <div className="p-6">
              {step === 'upload' && (
                <UploadStep
                  isDragOver={isDragOver}
                  loading={loading}
                  error={error}
                  warning={warning}
                  originalImage={originalImage}
                  originalImageUrl={originalImageUrl}
                  pendingUploads={pendingUploads}
                  onFileChange={handleFileChange}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onMobileUploadSelect={handleMobileUploadSelect}
                  onContinue={handleContinueFromUpload}
                />
              )}

              {step === 'calibrate' && originalImage && (
                <>
                  {error && (
                    <div className="mb-3 px-4 py-3 rounded-lg bg-[#ff8d49]/10 border border-[#ff8d49]/20">
                      <p className="text-body-sm text-[#ff8d49]">{error}</p>
                    </div>
                  )}
                  <CalibrationStep
                    image={originalImage}
                    imageUrl={originalImageUrl}
                    initialCorners={corners}
                    initialWidthInches={blockWidthInches}
                    initialHeightInches={blockHeightInches}
                    onContinue={handleCalibrationContinue}
                    onBack={() => setStep('upload')}
                  />
                  {warping && (
                    <div className="mt-3 text-center text-body-sm text-[var(--color-text-dim)]">
                      Flattening block…
                    </div>
                  )}
                </>
              )}

              {step === 'layout' && warpedImageRef && (
                <LayoutPickerStep
                  warpedImage={warpedImageRef}
                  widthInches={blockWidthInches}
                  heightInches={blockHeightInches}
                  selectedPreset={selectedPreset}
                  onSelectPreset={setSelectedPreset}
                  onContinue={handleLayoutContinue}
                  onBack={() => setStep('calibrate')}
                />
              )}

              {step === 'review' && warpedImageRef && (
                <PhotoReviewStep
                  warpedImage={warpedImageRef}
                  cells={cells}
                  widthInches={blockWidthInches}
                  heightInches={blockHeightInches}
                  onUpdateCellColor={updateCellColor}
                  onConfirm={handleOpenInStudio}
                  onBack={() => setStep('layout')}
                />
              )}

              {/* Fallback for any mismatched state — should never render in
                  happy paths but guards against stale store data. */}
              {step !== 'upload' && step !== 'calibrate' && step !== 'layout' && step !== 'review' && (
                <p className="text-body-md text-[var(--color-text-dim)]">
                  Unknown step: {step}
                </p>
              )}
            </div>

            {/* Step indicator dots */}
            <div className="pb-4 mt-2 flex justify-center gap-2">
              {STEP_KEYS.map((key, i) => (
                <div
                  key={key}
                  className={`rounded-full w-2 h-2 transition-colors ${
                    i === currentStepIndex ? 'bg-[#ff8d49]' : 'bg-[#ff8d49]/30'
                  }`}
                  aria-label={STEP_LABELS[i]}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Upload step (extracted for readability)
// ---------------------------------------------------------------------------

interface UploadStepProps {
  isDragOver: boolean;
  loading: boolean;
  error: string | null;
  warning: string | null;
  originalImage: HTMLImageElement | null;
  originalImageUrl: string;
  pendingUploads: MobileUpload[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onMobileUploadSelect: (upload: MobileUpload) => void;
  onContinue: () => void;
}

function UploadStep(props: UploadStepProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-4">
      <p className="text-body-md text-[var(--color-text-dim)] text-center">
        Extract a quilt-block pattern from a photo. Choose a source:
      </p>

      <div className="space-y-3">
        {/* Hidden file input — triggered imperatively via inputRef.current.click()
            instead of a <label htmlFor> wrapper. Label + sr-only input can
            silently fail in Chromium when the input's hit box is effectively
            zero (clip-path + 1x1), so we drive it from an onClick handler on
            a real <button> to guarantee the user gesture reaches the input. */}
        <input
          id="photo-upload-file-input"
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={props.onFileChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={props.onDrop}
          onDragOver={props.onDragOver}
          onDragLeave={props.onDragLeave}
          aria-label="Drop your quilt photo here or click to browse. PNG, JPEG, or WebP up to 20 MB"
          className={`block w-full rounded-lg border-2 border-dashed p-8 text-center transition-colors duration-150 cursor-pointer relative overflow-hidden ${
            props.isDragOver
              ? 'border-[#ff8d49] bg-[#ff8d49]/5'
              : 'border-[var(--color-border)]/50 hover:border-[#ff8d49]/50'
          }`}
        >
          {props.loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ff8d49]/20 flex items-center justify-center animate-pulse">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  className="text-[#ff8d49]"
                >
                  <circle cx="10" cy="10" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <p className="text-body-md text-[var(--color-text-dim)]">Processing image...</p>
            </div>
          ) : (
            <>
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                className="mx-auto mb-3 text-[var(--color-text-dim)]"
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
              <p className="text-body-md font-medium text-[var(--color-text)]">Drop your quilt photo here</p>
              <p className="mt-1 text-body-sm text-[var(--color-text-dim)]">or click to browse</p>
              <p className="mt-2 text-label-sm text-[var(--color-text-dim)]">PNG, JPEG, or WebP up to 20 MB</p>
            </>
          )}
        </button>

        {/* Or choose from mobile uploads */}
        {props.pendingUploads.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <QuiltPieceRow count={2} size={8} gap={4} />
              <p className="text-body-sm text-[var(--color-text-dim)]">Or choose from mobile uploads:</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {props.pendingUploads.slice(0, 4).map((upload) => (
                <button
                  key={upload.id}
                  type="button"
                  onClick={() => props.onMobileUploadSelect(upload)}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden transition-colors group text-left hover:shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
                >
                  <div className="aspect-square bg-[var(--color-bg)] overflow-hidden">
                    <img
                      src={upload.imageUrl}
                      alt={upload.originalFilename || 'Mobile upload'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-label-sm font-medium text-[var(--color-text)] truncate">
                      {upload.originalFilename || 'Untitled'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {props.error && (
        <div className="px-4 py-3 rounded-lg bg-[#ff8d49]/10 border border-[#ff8d49]/20">
          <p className="text-body-sm text-[#ff8d49]">{props.error}</p>
        </div>
      )}
      {props.warning && (
        <div className="px-4 py-3 rounded-lg bg-[#ffc8a6]/20 border border-[#ffc8a6]/40">
          <p className="text-body-sm text-[var(--color-text-dim)]">{props.warning}</p>
        </div>
      )}

      {props.originalImage && (
        <div className="space-y-3">
          <img
            src={props.originalImageUrl}
            alt="Uploaded quilt photo preview"
            className="w-full rounded-lg object-contain max-h-96"
          />
          <button
            type="button"
            onClick={props.onContinue}
            className="w-full bg-[#ff8d49] text-[var(--color-text)] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
