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
import type { MobileUpload } from '@/types/mobile-upload';

const ACCEPTED_TYPES_SET = new Set<string>(ACCEPTED_IMAGE_TYPES);

const STEP_LABELS = ['Upload', 'Image Prep', 'Scan Settings', 'Processing', 'Complete'];

const STEP_KEYS: Array<'upload' | 'imagePrep' | 'scanSettings' | 'processing' | 'complete'> = [
  'upload',
  'imagePrep',
  'scanSettings',
  'processing',
  'complete',
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
  const setDetectedPieces = usePhotoLayoutStore((s) => s.setDetectedPieces);
  const setScaledPieces = usePhotoLayoutStore((s) => s.setScaledPieces);
  const setCorrectedImageRef = usePhotoLayoutStore((s) => s.setCorrectedImageRef);
  const setPipelineSteps = usePhotoLayoutStore((s) => s.setPipelineSteps);
  const reset = usePhotoLayoutStore((s) => s.reset);

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
        if (result.correctedImageRef) {
          setCorrectedImageRef(result.correctedImageRef);
        }
        setStep('complete');
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

      router.push(`/studio/${newId}`);
    } catch {
      setError('Failed to create project. Please try again.');
    }
  };

  if (showProUpgrade) {
    return <ProUpgradeModal onClose={() => setShowProUpgrade(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#fdfaf7] flex flex-col relative overflow-hidden">
      {/* Decorative quilt-piece backgrounds - HUGE, spread out, high opacity, charcoal stitches, flush */}
      <QuiltPiece color="primary" size={500} rotation={0} top={-100} left={-100} opacity={20} strokeWidth={3} stitchGap={8} stitchColor="#2d2a26" />
      <QuiltPiece color="secondary" size={450} rotation={0} top={50} right={-150} opacity={18} strokeWidth={3} stitchGap={8} stitchColor="#2d2a26" />
      <QuiltPiece color="accent" size={400} rotation={0} bottom={-50} left={-80} opacity={22} strokeWidth={3} stitchGap={8} stitchColor="#2d2a26" />
      <QuiltPiece color="primary" size={350} rotation={0} bottom={-100} right={-50} opacity={16} strokeWidth={3} stitchGap={8} stitchColor="#2d2a26" />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e1da] relative z-10">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-2 text-body-sm text-[#6b655e] hover:text-[#ff8d49] transition-colors duration-150"
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
          <h2 className="text-headline-sm font-semibold text-[#2d2a26]">Photo to Design</h2>
          <QuiltPieceRow count={3} size={10} gap={4} colors={['accent', 'secondary', 'primary']} />
        </div>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto px-6 py-8 relative z-10">
        <div className="max-w-2xl mx-auto">
          <div
            data-testid="photo-pattern-wizard"
            className="bg-[#ffffff] border border-[#e8e1da] rounded-xl shadow-[0_1px_2px_rgba(45,42,38,0.08)] relative overflow-hidden"
          >
            {/* Quilt-piece accent strip at top of card */}
            <div className="h-2 bg-gradient-to-r from-[#ff8d49]/20 via-[#ffc8a6]/20 to-[#ffc7c7]/20" />

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
                setRotation={setRotation}
                setFlipH={setFlipH}
                setFlipV={setFlipV}
                setCurvedSeams={setCurvedSeams}
                setApplique={setApplique}
                setTouchingFabrics={setTouchingFabrics}
                setHeavyQuilting={setHeavyQuilting}
                setPieceScale={setPieceScale}
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
  setRotation: React.Dispatch<React.SetStateAction<number>>;
  setFlipH: React.Dispatch<React.SetStateAction<boolean>>;
  setFlipV: React.Dispatch<React.SetStateAction<boolean>>;
  setCurvedSeams: React.Dispatch<React.SetStateAction<boolean>>;
  setApplique: React.Dispatch<React.SetStateAction<boolean>>;
  setTouchingFabrics: React.Dispatch<React.SetStateAction<boolean>>;
  setHeavyQuilting: React.Dispatch<React.SetStateAction<boolean>>;
  setPieceScale: React.Dispatch<React.SetStateAction<'tiny' | 'standard' | 'large'>>;
}

function WizardStepContent(props: WizardStepContentProps) {
  switch (props.step) {
    case 'upload':
      return <UploadStep {...props} />;
    case 'imagePrep':
      return <ImagePrepStep {...props} />;
    case 'scanSettings':
      return <ScanSettingsStep {...props} />;
    case 'processing':
      return <ProcessingStep />;
    case 'complete':
      return <CompleteStep onOpenInStudio={props.onOpenInStudio} />;
    default:
      return <p className="text-body-md text-[#6b655e]">Unknown step: {props.step}</p>;
  }
}

// ---------------------------------------------------------------------------
// Individual step components
// ---------------------------------------------------------------------------

function UploadStep(props: WizardStepContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-body-md text-[#6b655e] text-center">
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
          className={`block w-full rounded-xl border-2 border-dashed p-8 text-center transition-colors duration-150 cursor-pointer relative overflow-hidden ${
            props.isDragOver
              ? 'border-[#ff8d49] bg-[#ff8d49]/5'
              : 'border-[#e8e1da]/50 hover:border-[#ff8d49]/50'
          }`}
        >
          {/* Subtle quilt-piece decoration in drop zone */}
          <div className="absolute top-2 right-2 opacity-12 pointer-events-none">
            <QuiltPiece color="primary" size={80} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={6} />
          </div>
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
              <p className="text-body-md text-[#6b655e]">Processing image...</p>
            </div>
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
        </button>

        {/* Or choose from mobile uploads */}
        {props.pendingUploads.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <QuiltPieceRow count={2} size={8} gap={4} />
              <p className="text-body-sm text-[#6b655e]">Or choose from mobile uploads:</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {props.pendingUploads.slice(0, 4).map((upload) => (
                <button
                  key={upload.id}
                  type="button"
                  onClick={() => props.onMobileUploadSelect(upload)}
                  className="bg-[#ffffff] border border-[#e8e1da] rounded-xl overflow-hidden transition-colors group text-left hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
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
          </div>
        )}
      </div>

      {props.error && (
        <div className="px-4 py-3 rounded-xl bg-[#ff8d49]/10 border border-[#ff8d49]/20">
          <p className="text-body-sm text-[#ff8d49]">{props.error}</p>
        </div>
      )}
      {props.warning && (
        <div className="px-4 py-3 rounded-xl bg-[#ffc8a6]/20 border border-[#ffc8a6]/40">
          <p className="text-body-sm text-[#6b655e]">{props.warning}</p>
        </div>
      )}

      {props.originalImage && (
        <div className="space-y-3">
          <img
            src={props.originalImageUrl}
            alt="Uploaded quilt photo preview"
            className="w-full rounded-xl object-contain max-h-96"
          />
          <button
            type="button"
            onClick={props.onContinue}
            className="w-full bg-[#ff8d49] text-[#2d2a26] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
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
      <h3 className="text-headline-sm font-semibold text-[#2d2a26]">
        Straighten &amp; adjust your image
      </h3>

      {/* Preview */}
      <div className="rounded-xl overflow-hidden bg-[#fdfaf7] aspect-video flex items-center justify-center border border-[#e8e1da] relative">
        {/* Subtle stitch decoration */}
        <div className="absolute top-2 left-2 opacity-12 pointer-events-none">
          <QuiltPiece color="accent" size={60} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={6} />
        </div>
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
        <label className="text-body-sm font-medium text-[#2d2a26]">
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
          className="rounded-lg bg-[#fdfaf7] border border-[#e8e1da] px-4 py-2 text-sm font-medium text-[#6b655e] hover:bg-[#e8e1da] transition-colors duration-150"
        >
          -90°
        </button>
        <button
          type="button"
          onClick={() => props.setRotation((r) => r + 90)}
          className="rounded-lg bg-[#fdfaf7] border border-[#e8e1da] px-4 py-2 text-sm font-medium text-[#6b655e] hover:bg-[#e8e1da] transition-colors duration-150"
        >
          +90°
        </button>
        <button
          type="button"
          onClick={() => props.setFlipH((f) => !f)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 border ${
            props.flipH
              ? 'bg-[#ff8d49] text-[#2d2a26] border-[#ff8d49]'
              : 'bg-[#fdfaf7] border-[#e8e1da] text-[#6b655e] hover:bg-[#e8e1da]'
          }`}
        >
          Flip H
        </button>
        <button
          type="button"
          onClick={() => props.setFlipV((f) => !f)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150 border ${
            props.flipV
              ? 'bg-[#ff8d49] text-[#2d2a26] border-[#ff8d49]'
              : 'bg-[#fdfaf7] border-[#e8e1da] text-[#6b655e] hover:bg-[#e8e1da]'
          }`}
        >
          Flip V
        </button>
      </div>

      <button
        type="button"
        onClick={props.onContinue}
        className="w-full bg-[#ff8d49] text-[#2d2a26] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
      >
        Continue
      </button>
    </div>
  );
}

function ScanSettingsStep(props: WizardStepContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <QuiltPieceRow count={3} size={10} gap={4} />
        <h3 className="text-headline-sm font-semibold text-[#2d2a26]">Tell us about your quilt</h3>
      </div>

      {/* Curved seams */}
      <button
        type="button"
        onClick={() => props.setCurvedSeams((v) => !v)}
        className={`w-full bg-[#ffffff] border rounded-xl p-4 text-left transition-colors duration-150 ${
          props.curvedSeams
            ? 'border-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            : 'border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
        }`}
      >
        <p className="text-body-md font-medium text-[#2d2a26]">
          Does this quilt have curved seams?
        </p>
        <p className="text-body-sm text-[#6b655e] mt-1">
          Drunkard&apos;s Path, Orange Peel, Wedding Ring, Clamshell
        </p>
      </button>

      {/* Applique */}
      <button
        type="button"
        onClick={() => props.setApplique((v) => !v)}
        className={`w-full bg-[#ffffff] border rounded-xl p-4 text-left transition-colors duration-150 ${
          props.applique
            ? 'border-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            : 'border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
        }`}
      >
        <p className="text-body-md font-medium text-[#2d2a26]">
          Are there shapes sewn on top of the background?
        </p>
        <p className="text-body-sm text-[#6b655e] mt-1">
          Needle-turn applique, raw-edge applique, fused shapes
        </p>
      </button>

      {/* Touching fabrics */}
      <button
        type="button"
        onClick={() => props.setTouchingFabrics((v) => !v)}
        className={`w-full bg-[#ffffff] border rounded-xl p-4 text-left transition-colors duration-150 ${
          props.touchingFabrics
            ? 'border-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            : 'border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
        }`}
      >
        <p className="text-body-md font-medium text-[#2d2a26]">
          Are there pieces of the exact same fabric sewn touching each other?
        </p>
      </button>

      {/* Heavy quilting */}
      <button
        type="button"
        onClick={() => props.setHeavyQuilting((v) => !v)}
        className={`w-full bg-[#ffffff] border rounded-xl p-4 text-left transition-colors duration-150 ${
          props.heavyQuilting
            ? 'border-[#ff8d49] shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            : 'border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
        }`}
      >
        <p className="text-body-md font-medium text-[#2d2a26]">
          Is there heavy quilting or embroidery over the pieces?
        </p>
      </button>

      {/* Piece scale selector */}
      <div className="space-y-2">
        <p className="text-body-md font-medium text-[#2d2a26]">How big are the pieces generally?</p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => props.setPieceScale('tiny')}
            className={`bg-[#ffffff] border rounded-lg p-3 text-center transition-colors duration-150 ${
              props.pieceScale === 'tiny'
                ? 'border-[#ff8d49] bg-[#ff8d49]/10 shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                : 'border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            }`}
          >
            <p className="text-body-sm font-medium text-[#2d2a26]">Tiny</p>
            <p className="text-label-xs text-[#6b655e] mt-1">Under 2&quot;</p>
          </button>
          <button
            type="button"
            onClick={() => props.setPieceScale('standard')}
            className={`bg-[#ffffff] border rounded-lg p-3 text-center transition-colors duration-150 ${
              props.pieceScale === 'standard'
                ? 'border-[#ff8d49] bg-[#ff8d49]/10 shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                : 'border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            }`}
          >
            <p className="text-body-sm font-medium text-[#2d2a26]">Standard</p>
            <p className="text-label-xs text-[#6b655e] mt-1">2&quot;-6&quot;</p>
          </button>
          <button
            type="button"
            onClick={() => props.setPieceScale('large')}
            className={`bg-[#ffffff] border rounded-lg p-3 text-center transition-colors duration-150 ${
              props.pieceScale === 'large'
                ? 'border-[#ff8d49] bg-[#ff8d49]/10 shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
                : 'border-[#e8e1da] hover:shadow-[0_1px_2px_rgba(45,42,38,0.08)]'
            }`}
          >
            <p className="text-body-sm font-medium text-[#2d2a26]">Large</p>
            <p className="text-label-xs text-[#6b655e] mt-1">6&quot;+</p>
          </button>
        </div>
      </div>

      <p className="text-body-sm text-[#6b655e] text-center">
        Default settings work well for most quilts.
      </p>

      <button
        type="button"
        onClick={props.onContinue}
        className="w-full bg-[#ff8d49] text-[#2d2a26] px-6 py-3 rounded-lg text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
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
        <h3 className="text-headline-sm font-semibold text-[#2d2a26]">Analyzing your quilt</h3>
        <p className="text-body-md text-[#6b655e]">
          Detecting pieces and extracting the pattern...
        </p>
      </div>
      {/* Quilt-piece decoration */}
      <div className="flex justify-center gap-3 opacity-25">
        <QuiltPiece color="primary" size={32} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={4} />
        <QuiltPiece color="secondary" size={28} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={4} />
        <QuiltPiece color="accent" size={24} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={4} />
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
      <h3 className="text-headline-sm font-semibold text-[#2d2a26]">Pattern extracted!</h3>
      <p className="text-body-md text-[#6b655e]">
        Your quilt pieces have been detected. You can now assign fabrics and export to the studio.
      </p>
      {/* Quilt-piece celebration */}
      <div className="flex justify-center gap-4 opacity-35">
        <QuiltPiece color="accent" size={28} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={4} />
        <QuiltPiece color="primary" size={32} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={4} />
        <QuiltPiece color="secondary" size={26} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={4} />
        <QuiltPiece color="primary" size={30} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={4} />
        <QuiltPiece color="accent" size={24} rotation={0} stitch={true} stitchColor="#2d2a26" strokeWidth={2} stitchGap={4} />
      </div>
      <button
        type="button"
        onClick={onOpenInStudio}
        className="bg-[#ff8d49] text-[#2d2a26] px-8 py-3 rounded-lg text-sm font-semibold hover:bg-[#e67d3f] transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
      >
        Open in Studio
      </button>
    </div>
  );
}
