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
import { runDetectionPipeline } from '@/lib/photo-layout-utils';
import { PhotoReviewStep } from '@/components/photo-layout/PhotoReviewStep';
import type { MobileUpload } from '@/types/mobile-upload';
import type { ScaledPiece, PhotoLayoutStep } from '@/lib/photo-layout-types';

const ACCEPTED_TYPES_SET = new Set<string>(ACCEPTED_IMAGE_TYPES);

const STEP_LABELS = ['Upload', 'Image Prep', 'Crop', 'Scan Settings', 'Processing', 'Review'];

const STEP_KEYS: Array<PhotoLayoutStep> = [
  'upload',
  'imagePrep',
  'crop',
  'scanSettings',
  'processing',
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
  const sensitivity = usePhotoLayoutStore((s) => s.sensitivity);
  const detectedPieces = usePhotoLayoutStore((s) => s.detectedPieces);
  const scaledPieces = usePhotoLayoutStore((s) => s.scaledPieces);
  const setDetectedPieces = usePhotoLayoutStore((s) => s.setDetectedPieces);
  const setScaledPieces = usePhotoLayoutStore((s) => s.setScaledPieces);
  const setCorrectedImageRef = usePhotoLayoutStore((s) => s.setCorrectedImageRef);
  const setPipelineSteps = usePhotoLayoutStore((s) => s.setPipelineSteps);
  const reset = usePhotoLayoutStore((s) => s.reset);

  const targetWidth = usePhotoLayoutStore((s) => s.targetWidth);
  const targetHeight = usePhotoLayoutStore((s) => s.targetHeight);
  const seamAllowance = usePhotoLayoutStore((s) => s.seamAllowance);

  // Review step metadata captured from the last pipeline run. Kept in component
  // state because only the review UI needs it.
  const [detectionSize, setDetectionSize] = useState<{ w: number; h: number } | null>(null);
  const [inferredUnitPx, setInferredUnitPx] = useState(0);
  const [inferredRotationDeg, setInferredRotationDeg] = useState(0);
  const [classCount, setClassCount] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Image prep state
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Scan settings state (merged: characteristics + piece scale)
  const [curvedSeams, setCurvedSeams] = useState(false);
  const [applique, setApplique] = useState(false);
  const [touchingFabrics, setTouchingFabrics] = useState(false);
  const [heavyQuilting, setHeavyQuilting] = useState(false);
  const [pieceScale, setPieceScale] = useState<'tiny' | 'standard' | 'large'>('standard');

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
        setStep('imagePrep');
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

  // Run detection pipeline when step transitions to 'processing'
  useEffect(() => {
    if (step !== 'processing' || !originalImage) return;

    let cancelled = false;

    const config = {
      hasCurvedPiecing: curvedSeams,
      hasApplique: applique,
      hasLowContrastSeams: touchingFabrics,
      hasHeavyTopstitching: heavyQuilting,
      pieceScale,
    };

    async function runPipeline() {
      try {
        const result = await runDetectionPipeline(
          originalImage!,
          (steps: import('@/lib/photo-layout-types').PipelineStep[]) => {
            if (!cancelled) {
              setPipelineSteps(steps);
            }
          },
          {
            sensitivity,
            scanConfig: config,
          }
        );

        if (cancelled) return;

        setDetectedPieces(result.pieces);
        setScaledPieces(result.scaledPieces);
        setDetectionSize({ w: result.imageWidthPx, h: result.imageHeightPx });
        setInferredUnitPx(result.inferredUnitPx);
        setInferredRotationDeg(result.inferredRotationDeg);
        setClassCount(result.classCount);
        if (result.correctedImageRef) {
          setCorrectedImageRef(result.correctedImageRef);
        }
        setStep('review');
      } catch {
        if (!cancelled) {
          setError('Detection failed. Please try again with a different image.');
          setStep('scanSettings');
        }
      }
    }

    runPipeline();

    return () => {
      cancelled = true;
    };
  }, [
    step,
    originalImage,
    sensitivity,
    curvedSeams,
    applique,
    touchingFabrics,
    heavyQuilting,
    pieceScale,
    setDetectedPieces,
    setScaledPieces,
    setCorrectedImageRef,
    setPipelineSteps,
    setStep,
  ]);

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

  const handleContinue = () => {
    if (!isPro && !isLoadingAuth) {
      setShowProUpgrade(true);
      return;
    }

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_KEYS.length) {
      setStep(STEP_KEYS[nextIndex]);
    }
  };

  const handleClose = () => {
    reset();
    router.push('/dashboard');
  };

  // Full OpenCV re-scan from the Review step. Clears current detection results
  // and routes back through 'processing', which retriggers the pipeline effect.
  const handleRescan = useCallback(() => {
    setDetectedPieces([]);
    setScaledPieces([]);
    setDetectionSize(null);
    setInferredUnitPx(0);
    setInferredRotationDeg(0);
    setClassCount(0);
    setStep('processing');
  }, [setDetectedPieces, setScaledPieces, setStep]);

  // "Back to settings" from the Review step — user wants to change scan
  // config (e.g. flip the curved seams toggle) and rerun.
  const handleBackToSettings = useCallback(() => {
    setStep('scanSettings');
  }, [setStep]);

  /**
   * Creates a new project sized to match the detected pattern, then navigates
   * to it. The detected pieces stay in the photoLayoutStore — when the studio
   * mounts, usePhotoPatternImport picks them up, places them on the canvas,
   * and calls reset() itself to clear the store.
   */
  const handleOpenInStudio = async () => {
    const { targetWidth, targetHeight } = usePhotoLayoutStore.getState();

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Photo Pattern',
          unitSystem: 'imperial',
          canvasWidth: targetWidth,
          canvasHeight: targetHeight,
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
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)] relative overflow-hidden"
          >
            {/* Quilt-piece accent strip at top of card */}
            <div className="h-2 bg-[var(--color-bg)]" />

            <div className="p-6">
              <WizardStepContent
                step={step}
                originalImage={originalImage}
                originalImageUrl={originalImageUrl}
                isDragOver={isDragOver}
                loading={loading}
                error={error}
                warning={warning}
                rotation={rotation}
                flipH={flipH}
                flipV={flipV}
                curvedSeams={curvedSeams}
                applique={applique}
                touchingFabrics={touchingFabrics}
                heavyQuilting={heavyQuilting}
                pieceScale={pieceScale}
                pendingUploads={pendingUploads}
                inputRef={inputRef}
                onFileChange={handleFileChange}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onMobileUploadSelect={handleMobileUploadSelect}
                onContinue={handleContinue}
                onClose={handleClose}
                onOpenInStudio={handleOpenInStudio}
                setOriginalImage={setOriginalImage}
                setRotation={setRotation}
                setFlipH={setFlipH}
                setFlipV={setFlipV}
                setCurvedSeams={setCurvedSeams}
                setApplique={setApplique}
                setTouchingFabrics={setTouchingFabrics}
                setHeavyQuilting={setHeavyQuilting}
                setPieceScale={setPieceScale}
                detectedPieces={detectedPieces}
                scaledPieces={scaledPieces}
                detectionSize={detectionSize}
                targetWidth={targetWidth}
                targetHeight={targetHeight}
                seamAllowance={seamAllowance}
                inferredUnitPx={inferredUnitPx}
                inferredRotationDeg={inferredRotationDeg}
                classCount={classCount}
                onUpdateScaledPieces={setScaledPieces}
                onRescan={handleRescan}
                onBackToSettings={handleBackToSettings}
              />
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
// Step content (extracted for readability)
// ---------------------------------------------------------------------------

interface WizardStepContentProps {
  step: string;
  originalImage: HTMLImageElement | null;
  originalImageUrl: string;
  isDragOver: boolean;
  loading: boolean;
  error: string | null;
  warning: string | null;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  curvedSeams: boolean;
  applique: boolean;
  touchingFabrics: boolean;
  heavyQuilting: boolean;
  pieceScale: 'tiny' | 'standard' | 'large';
  pendingUploads: MobileUpload[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onMobileUploadSelect: (upload: MobileUpload) => void;
  onContinue: () => void;
  onClose: () => void;
  onOpenInStudio: () => void;
  setOriginalImage: (img: HTMLImageElement, url: string) => void;
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  setFlipH: React.Dispatch<React.SetStateAction<boolean>>;
  setFlipV: React.Dispatch<React.SetStateAction<boolean>>;
  setCurvedSeams: React.Dispatch<React.SetStateAction<boolean>>;
  setApplique: React.Dispatch<React.SetStateAction<boolean>>;
  setTouchingFabrics: React.Dispatch<React.SetStateAction<boolean>>;
  setHeavyQuilting: React.Dispatch<React.SetStateAction<boolean>>;
  setPieceScale: React.Dispatch<React.SetStateAction<'tiny' | 'standard' | 'large'>>;
  // Review step
  detectedPieces: readonly import('@/lib/photo-layout-types').DetectedPiece[];
  scaledPieces: readonly ScaledPiece[];
  detectionSize: { w: number; h: number } | null;
  targetWidth: number;
  targetHeight: number;
  seamAllowance: number;
  inferredUnitPx: number;
  inferredRotationDeg: number;
  classCount: number;
  onUpdateScaledPieces: (pieces: readonly ScaledPiece[]) => void;
  onRescan: () => void;
  onBackToSettings: () => void;
}

function WizardStepContent(props: WizardStepContentProps) {
  switch (props.step) {
    case 'upload':
      return <UploadStep {...props} />;
    case 'imagePrep':
      return <ImagePrepStep {...props} />;
    case 'crop':
      return <CropStep {...props} />;
    case 'scanSettings':
      return <ScanSettingsStep {...props} />;
    case 'processing':
      return <ProcessingStep />;
    case 'review':
      if (!props.detectionSize) {
        return <ProcessingStep />;
      }
      return (
        <PhotoReviewStep
          originalImageUrl={props.originalImageUrl}
          detectedPieces={props.detectedPieces}
          scaledPieces={props.scaledPieces}
          imageWidthPx={props.detectionSize.w}
          imageHeightPx={props.detectionSize.h}
          targetWidthInches={props.targetWidth}
          targetHeightInches={props.targetHeight}
          seamAllowance={props.seamAllowance}
          inferredUnitPx={props.inferredUnitPx}
          inferredRotationDeg={props.inferredRotationDeg}
          classCount={props.classCount}
          onUpdateScaledPieces={props.onUpdateScaledPieces}
          onRescan={props.onRescan}
          onConfirm={props.onOpenInStudio}
          onBack={props.onBackToSettings}
        />
      );
    case 'complete':
      return <CompleteStep onOpenInStudio={props.onOpenInStudio} />;
    default:
      return <p className="text-body-md text-[var(--color-text-dim)]">Unknown step: {props.step}</p>;
  }
}

// ---------------------------------------------------------------------------
// Individual step components
// ---------------------------------------------------------------------------

function UploadStep(props: WizardStepContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-body-md text-[var(--color-text-dim)] text-center">
        Extract quilt pieces from a photo using AI. Choose a source:
      </p>

      <div className="space-y-3">
        {/* Hidden file input — triggered imperatively via inputRef.current.click()
            instead of a <label htmlFor> wrapper. Label + sr-only input can
            silently fail in Chromium when the input's hit box is effectively
            zero (clip-path + 1x1), so we drive it from an onClick handler on
            a real <button> to guarantee the user gesture reaches the input. */}
        <input
          id="photo-upload-file-input"
          ref={props.inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={props.onFileChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />
        <button
          type="button"
          onClick={() => props.inputRef.current?.click()}
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
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden transition-colors group text-left hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
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
            className="w-full bg-[#ff8d49] text-[var(--color-text)] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}

function ImagePrepStep(props: WizardStepContentProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">
        Straighten &amp; adjust your image
      </h3>

      {/* Preview */}
      <div className="rounded-lg overflow-hidden bg-[var(--color-bg)] aspect-video flex items-center justify-center border border-[var(--color-border)]">
        <img
          src={props.originalImageUrl}
          alt="Image to adjust"
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `rotate(${props.rotation}deg) scaleX(${props.flipH ? -1 : 1}) scaleY(${props.flipV ? -1 : 1})`,
          }}
        />
      </div>

      {/* Rotation slider */}
      <div className="space-y-2">
        <label className="text-body-sm font-medium text-[var(--color-text)]">
          Straighten: {props.rotation}°
        </label>
        <input
          type="range"
          min="-180"
          max="180"
          value={props.rotation}
          onChange={(e) => props.setRotation(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Flip and rotation buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => props.setRotation((r) => r - 90)}
          className="rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150"
        >
          -90°
        </button>
        <button
          type="button"
          onClick={() => props.setRotation((r) => r + 90)}
          className="rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150"
        >
          +90°
        </button>
        <button
          type="button"
          onClick={() => props.setFlipH((f) => !f)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 border ${
            props.flipH
              ? 'bg-[#ff8d49] text-[var(--color-text)] border-[#ff8d49]'
              : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]'
          }`}
        >
          Flip H
        </button>
        <button
          type="button"
          onClick={() => props.setFlipV((f) => !f)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 border ${
            props.flipV
              ? 'bg-[#ff8d49] text-[var(--color-text)] border-[#ff8d49]'
              : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-text-dim)] hover:bg-[var(--color-border)]'
          }`}
        >
          Flip V
        </button>
      </div>

      <button
        type="button"
        onClick={props.onContinue}
        className="w-full bg-[#ff8d49] text-[var(--color-text)] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
      >
        Continue
      </button>
    </div>
  );
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type CropDragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

function CropStep(props: WizardStepContentProps) {
  const {
    originalImage,
    rotation,
    flipH,
    flipV,
    setOriginalImage,
    setRotation,
    setFlipH,
    setFlipV,
    onContinue,
  } = props;

  // The image with rotation + flip baked in, used both for preview and as the
  // source we crop from. Kept as an object URL so it can be passed to an <img>
  // element and revoked on unmount.
  const [transformedUrl, setTransformedUrl] = useState<string | null>(null);
  const [transformedSize, setTransformedSize] = useState<{ w: number; h: number } | null>(null);
  const [crop, setCrop] = useState<CropRect>({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [baking, setBaking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Bake rotation + flip into an offscreen canvas once on entry (or whenever
  // the user navigates back after changing rotation). We translate the
  // transform center to the midpoint so rotation is around the image center,
  // then expand the target canvas to fit the rotated AABB.
  useEffect(() => {
    if (!originalImage) return;

    const rad = (rotation * Math.PI) / 180;
    const absCos = Math.abs(Math.cos(rad));
    const absSin = Math.abs(Math.sin(rad));
    const w = originalImage.naturalWidth;
    const h = originalImage.naturalHeight;
    const newW = Math.max(1, Math.round(w * absCos + h * absSin));
    const newH = Math.max(1, Math.round(w * absSin + h * absCos));

    const canvas = document.createElement('canvas');
    canvas.width = newW;
    canvas.height = newH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(newW / 2, newH / 2);
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(originalImage, -w / 2, -h / 2);

    let objectUrl: string | null = null;
    canvas.toBlob((blob) => {
      if (!blob) return;
      objectUrl = URL.createObjectURL(blob);
      setTransformedUrl(objectUrl);
      setTransformedSize({ w: newW, h: newH });
    }, 'image/png');

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [originalImage, rotation, flipH, flipV]);

  const startDrag = useCallback(
    (mode: CropDragMode) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const startX = e.clientX;
      const startY = e.clientY;
      const start: CropRect = { ...crop };
      const MIN = 0.05;

      const onMove = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / rect.width;
        const dy = (ev.clientY - startY) / rect.height;

        let { x, y, w, h } = start;

        if (mode === 'move') {
          x = Math.max(0, Math.min(1 - w, x + dx));
          y = Math.max(0, Math.min(1 - h, y + dy));
        } else if (mode === 'nw') {
          const nx = Math.max(0, Math.min(x + w - MIN, x + dx));
          const ny = Math.max(0, Math.min(y + h - MIN, y + dy));
          w = w + (x - nx);
          h = h + (y - ny);
          x = nx;
          y = ny;
        } else if (mode === 'ne') {
          const nw = Math.max(MIN, Math.min(1 - x, w + dx));
          const ny = Math.max(0, Math.min(y + h - MIN, y + dy));
          h = h + (y - ny);
          y = ny;
          w = nw;
        } else if (mode === 'sw') {
          const nx = Math.max(0, Math.min(x + w - MIN, x + dx));
          const nh = Math.max(MIN, Math.min(1 - y, h + dy));
          w = w + (x - nx);
          x = nx;
          h = nh;
        } else if (mode === 'se') {
          w = Math.max(MIN, Math.min(1 - x, w + dx));
          h = Math.max(MIN, Math.min(1 - y, h + dy));
        }

        setCrop({ x, y, w, h });
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [crop]
  );

  const handleReset = useCallback(() => {
    setCrop({ x: 0, y: 0, w: 1, h: 1 });
  }, []);

  const handleApplyAndContinue = useCallback(() => {
    if (!transformedUrl || !transformedSize) return;

    setBaking(true);

    const src = new Image();
    src.onload = () => {
      const cropPxX = Math.round(crop.x * transformedSize.w);
      const cropPxY = Math.round(crop.y * transformedSize.h);
      const cropPxW = Math.max(1, Math.round(crop.w * transformedSize.w));
      const cropPxH = Math.max(1, Math.round(crop.h * transformedSize.h));

      const canvas = document.createElement('canvas');
      canvas.width = cropPxW;
      canvas.height = cropPxH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setBaking(false);
        return;
      }
      ctx.drawImage(src, cropPxX, cropPxY, cropPxW, cropPxH, 0, 0, cropPxW, cropPxH);

      canvas.toBlob((blob) => {
        if (!blob) {
          setBaking(false);
          return;
        }
        const url = URL.createObjectURL(blob);
        const finalImg = new Image();
        finalImg.onload = () => {
          setOriginalImage(finalImg, url);
          // Rotation + flip are now baked into the new image, so reset the
          // prep state to avoid double-applying them on later steps.
          setRotation(0);
          setFlipH(false);
          setFlipV(false);
          setBaking(false);
          onContinue();
        };
        finalImg.onerror = () => setBaking(false);
        finalImg.src = url;
      }, 'image/png');
    };
    src.onerror = () => setBaking(false);
    src.src = transformedUrl;
  }, [
    transformedUrl,
    transformedSize,
    crop,
    setOriginalImage,
    setRotation,
    setFlipH,
    setFlipV,
    onContinue,
  ]);

  if (!originalImage || !transformedUrl || !transformedSize) {
    return (
      <div className="py-12 text-center">
        <p className="text-body-md text-[var(--color-text-dim)]">Preparing image...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">Crop to the quilt</h3>
      <p className="text-body-sm text-[var(--color-text-dim)]">
        Drag the corners to trim the photo down to just the quilt. Extra background can throw off
        piece detection.
      </p>

      <div className="flex items-center justify-center">
        <div
          ref={containerRef}
          className="relative bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg overflow-hidden select-none touch-none"
          style={{
            width: '100%',
            maxWidth: `${Math.min(600, transformedSize.w)}px`,
            aspectRatio: `${transformedSize.w} / ${transformedSize.h}`,
          }}
        >
          <img
            src={transformedUrl}
            alt="Crop preview"
            draggable={false}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
          <div
            className="absolute border-2 border-[#ff8d49] cursor-move"
            style={{
              left: `${crop.x * 100}%`,
              top: `${crop.y * 100}%`,
              width: `${crop.w * 100}%`,
              height: `${crop.h * 100}%`,
              boxShadow: '0 0 0 9999px rgba(45, 42, 38, 0.5)',
            }}
            onPointerDown={startDrag('move')}
          >
            <div
              className="absolute -left-2 -top-2 w-4 h-4 bg-[#ff8d49] border-2 border-white rounded-full cursor-nwse-resize"
              onPointerDown={startDrag('nw')}
            />
            <div
              className="absolute -right-2 -top-2 w-4 h-4 bg-[#ff8d49] border-2 border-white rounded-full cursor-nesw-resize"
              onPointerDown={startDrag('ne')}
            />
            <div
              className="absolute -left-2 -bottom-2 w-4 h-4 bg-[#ff8d49] border-2 border-white rounded-full cursor-nesw-resize"
              onPointerDown={startDrag('sw')}
            />
            <div
              className="absolute -right-2 -bottom-2 w-4 h-4 bg-[#ff8d49] border-2 border-white rounded-full cursor-nwse-resize"
              onPointerDown={startDrag('se')}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-dim)] hover:bg-[var(--color-border)] transition-colors duration-150"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleApplyAndContinue}
          disabled={baking}
          className="flex-1 bg-[#ff8d49] text-[var(--color-text)] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {baking ? 'Applying crop...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}

function ScanSettingsStep(props: WizardStepContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <QuiltPieceRow count={3} size={10} gap={4} />
        <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">Tell us about your quilt</h3>
      </div>

      {/* Curved seams */}
      <button
        type="button"
        onClick={() => props.setCurvedSeams((v) => !v)}
        className={`w-full bg-[var(--color-surface)] border rounded-full p-4 text-left transition-colors duration-150 ${
          props.curvedSeams
            ? 'border-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            : 'border-[var(--color-border)] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
        }`}
      >
        <p className="text-body-md font-medium text-[var(--color-text)]">
          Does this quilt have curved seams?
        </p>
        <p className="text-body-sm text-[var(--color-text-dim)] mt-1">
          Drunkard&apos;s Path, Orange Peel, Wedding Ring, Clamshell
        </p>
      </button>

      {/* Applique */}
      <button
        type="button"
        onClick={() => props.setApplique((v) => !v)}
        className={`w-full bg-[var(--color-surface)] border rounded-full p-4 text-left transition-colors duration-150 ${
          props.applique
            ? 'border-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            : 'border-[var(--color-border)] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
        }`}
      >
        <p className="text-body-md font-medium text-[var(--color-text)]">
          Are there shapes sewn on top of the background?
        </p>
        <p className="text-body-sm text-[var(--color-text-dim)] mt-1">
          Needle-turn applique, raw-edge applique, fused shapes
        </p>
      </button>

      {/* Touching fabrics */}
      <button
        type="button"
        onClick={() => props.setTouchingFabrics((v) => !v)}
        className={`w-full bg-[var(--color-surface)] border rounded-full p-4 text-left transition-colors duration-150 ${
          props.touchingFabrics
            ? 'border-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            : 'border-[var(--color-border)] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
        }`}
      >
        <p className="text-body-md font-medium text-[var(--color-text)]">
          Are there pieces of the exact same fabric sewn touching each other?
        </p>
      </button>

      {/* Heavy quilting */}
      <button
        type="button"
        onClick={() => props.setHeavyQuilting((v) => !v)}
        className={`w-full bg-[var(--color-surface)] border rounded-full p-4 text-left transition-colors duration-150 ${
          props.heavyQuilting
            ? 'border-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            : 'border-[var(--color-border)] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
        }`}
      >
        <p className="text-body-md font-medium text-[var(--color-text)]">
          Is there heavy quilting or embroidery over the pieces?
        </p>
      </button>

      {/* Piece scale selector */}
      <div className="space-y-2">
        <p className="text-body-md font-medium text-[var(--color-text)]">How big are the pieces generally?</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => props.setPieceScale('tiny')}
            className={`bg-[var(--color-surface)] border rounded-full p-3 text-center transition-colors duration-150 ${
              props.pieceScale === 'tiny'
                ? 'border-[#ff8d49] bg-[#ff8d49]/10 shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                : 'border-[var(--color-border)] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            }`}
          >
            <p className="text-body-sm font-medium text-[var(--color-text)]">Tiny</p>
            <p className="text-label-xs text-[var(--color-text-dim)] mt-1">Under 2&quot;</p>
          </button>
          <button
            type="button"
            onClick={() => props.setPieceScale('standard')}
            className={`bg-[var(--color-surface)] border rounded-full p-3 text-center transition-colors duration-150 ${
              props.pieceScale === 'standard'
                ? 'border-[#ff8d49] bg-[#ff8d49]/10 shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                : 'border-[var(--color-border)] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            }`}
          >
            <p className="text-body-sm font-medium text-[var(--color-text)]">Standard</p>
            <p className="text-label-xs text-[var(--color-text-dim)] mt-1">2&quot;-6&quot;</p>
          </button>
          <button
            type="button"
            onClick={() => props.setPieceScale('large')}
            className={`bg-[var(--color-surface)] border rounded-full p-3 text-center transition-colors duration-150 ${
              props.pieceScale === 'large'
                ? 'border-[#ff8d49] bg-[#ff8d49]/10 shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                : 'border-[var(--color-border)] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            }`}
          >
            <p className="text-body-sm font-medium text-[var(--color-text)]">Large</p>
            <p className="text-label-xs text-[var(--color-text-dim)] mt-1">6&quot;+</p>
          </button>
        </div>
      </div>

      <p className="text-body-sm text-[var(--color-text-dim)] text-center">
        Default settings work well for most quilts.
      </p>

      <button
        type="button"
        onClick={props.onContinue}
        className="w-full bg-[#ff8d49] text-[var(--color-text)] px-6 py-3 rounded-full text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
      >
        Analyze Quilt
      </button>
    </div>
  );
}

function ProcessingStep() {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="w-16 h-16 rounded-lg bg-[#ff8d49]/10 flex items-center justify-center mx-auto animate-pulse">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#ff8d49]">
          <circle
            cx="16"
            cy="16"
            r="10"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeDasharray="4 3"
          />
        </svg>
      </div>
      <div className="space-y-2">
        <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">Analyzing your quilt</h3>
        <p className="text-body-md text-[var(--color-text-dim)]">
          Detecting pieces and extracting the pattern...
        </p>
      </div>
    </div>
  );
}

function CompleteStep({ onOpenInStudio }: { onOpenInStudio: () => void }) {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="w-16 h-16 rounded-lg bg-[#ff8d49]/10 flex items-center justify-center mx-auto">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-[#ff8d49]">
          <path
            d="M8 16L14 22L24 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-headline-sm font-semibold text-[var(--color-text)]">Pattern extracted!</h3>
      <p className="text-body-md text-[var(--color-text-dim)]">
        Your quilt pieces have been detected. You can now assign fabrics and export to the studio.
      </p>
      <button
        type="button"
        onClick={onOpenInStudio}
        className="bg-[#ff8d49] text-[var(--color-text)] px-8 py-3 rounded-full text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
      >
        Open in Studio
      </button>
    </div>
  );
}
