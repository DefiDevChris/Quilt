'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { usePhotoLayoutStore } from '@/stores/photoLayoutStore';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';
import { useAuthStore } from '@/stores/authStore';
import { ProUpgradeModal } from '@/components/billing/ProUpgradeModal';
import {
  ACCEPTED_IMAGE_TYPES,
  PHOTO_PATTERN_MAX_FILE_SIZE,
  PHOTO_PATTERN_MIN_DIMENSION,
} from '@/lib/constants';
import { runDetectionPipeline } from '@/lib/photo-layout-utils';
import { loadOpenCv } from '@/lib/opencv-loader';
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
        const cv = await loadOpenCv();
        const result = await runDetectionPipeline(
          cv,
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

  if (showProUpgrade) {
    return <ProUpgradeModal onClose={() => setShowProUpgrade(false)} />;
  }

  return (
    <div className="min-h-screen bg-surface-container-lowest flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex items-center gap-2 text-body-sm text-secondary hover:text-on-surface transition-colors"
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
        <h2 className="text-headline-sm font-semibold text-on-surface">Photo to Design</h2>
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div data-testid="photo-pattern-wizard" className="glass-elevated rounded-2xl p-6">
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
              setRotation={setRotation}
              setFlipH={setFlipH}
              setFlipV={setFlipV}
              setCurvedSeams={setCurvedSeams}
              setApplique={setApplique}
              setTouchingFabrics={setTouchingFabrics}
              setHeavyQuilting={setHeavyQuilting}
              setPieceScale={setPieceScale}
            />

            {/* Step indicator dots */}
            <div className="pb-4 mt-6 flex justify-center gap-2">
              {STEP_KEYS.map((key, i) => (
                <div
                  key={key}
                  className={`rounded-full w-2 h-2 transition-colors ${
                    i === currentStepIndex ? 'bg-primary' : 'bg-primary-container/30'
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
      return <CompleteStep onClose={props.onClose} />;
    default:
      return <p className="text-body-md text-secondary">Unknown step: {props.step}</p>;
  }
}

// ---------------------------------------------------------------------------
// Individual step components
// ---------------------------------------------------------------------------

function UploadStep(props: WizardStepContentProps) {
  return (
    <div className="space-y-4">
      <p className="text-body-md text-secondary text-center">
        Extract quilt pieces from a photo using AI. Choose a source:
      </p>

      <div className="space-y-3">
        {/* Upload from Computer */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => props.inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              props.inputRef.current?.click();
            }
          }}
          onDrop={props.onDrop}
          onDragOver={props.onDragOver}
          onDragLeave={props.onDragLeave}
          className={`w-full rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
            props.isDragOver
              ? 'border-primary bg-primary/5'
              : 'border-outline-variant/30 hover:border-primary/50'
          }`}
        >
          <input
            ref={props.inputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            onChange={props.onFileChange}
            className="hidden"
          />
          {props.loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-body-md text-secondary">Processing image...</p>
            </div>
          ) : (
            <>
              <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                className="mx-auto mb-3 text-secondary"
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
              <p className="text-body-md font-medium text-on-surface">Drop your quilt photo here</p>
              <p className="mt-1 text-body-sm text-secondary">or click to browse</p>
              <p className="mt-2 text-label-sm text-secondary">PNG, JPEG, or WebP up to 20 MB</p>
            </>
          )}
        </div>

        {/* Or choose from mobile uploads */}
        {props.pendingUploads.length > 0 && (
          <div>
            <p className="text-body-sm text-secondary mb-2">Or choose from mobile uploads:</p>
            <div className="grid grid-cols-2 gap-3">
              {props.pendingUploads.slice(0, 4).map((upload) => (
                <button
                  key={upload.id}
                  type="button"
                  onClick={() => props.onMobileUploadSelect(upload)}
                  className="glass-panel rounded-xl overflow-hidden hover:shadow-elevation-2 transition-all group text-left"
                >
                  <div className="aspect-square bg-surface-container overflow-hidden">
                    <img
                      src={upload.imageUrl}
                      alt={upload.originalFilename || 'Mobile upload'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-label-sm font-medium text-on-surface truncate">
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
        <div className="px-4 py-3 rounded-xl bg-error/10 border border-error/20">
          <p className="text-body-sm text-error">{props.error}</p>
        </div>
      )}
      {props.warning && (
        <div className="px-4 py-3 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-body-sm text-warning">{props.warning}</p>
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
            className="w-full rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
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
      <h3 className="text-headline-sm font-semibold text-on-surface">
        Straighten &amp; adjust your image
      </h3>

      {/* Preview */}
      <div className="rounded-xl overflow-hidden bg-surface-container aspect-video flex items-center justify-center">
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
        <label className="text-body-sm font-medium text-on-surface">
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
          className="rounded-full bg-white/50 px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
        >
          -90°
        </button>
        <button
          type="button"
          onClick={() => props.setRotation((r) => r + 90)}
          className="rounded-full bg-white/50 px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
        >
          +90°
        </button>
        <button
          type="button"
          onClick={() => props.setFlipH((f) => !f)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            props.flipH
              ? 'bg-primary text-white'
              : 'bg-white/50 text-secondary hover:bg-surface-container'
          }`}
        >
          Flip H
        </button>
        <button
          type="button"
          onClick={() => props.setFlipV((f) => !f)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            props.flipV
              ? 'bg-primary text-white'
              : 'bg-white/50 text-secondary hover:bg-surface-container'
          }`}
        >
          Flip V
        </button>
      </div>

      <button
        type="button"
        onClick={props.onContinue}
        className="w-full rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Continue
      </button>
    </div>
  );
}

function ScanSettingsStep(props: WizardStepContentProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-headline-sm font-semibold text-on-surface">Tell us about your quilt</h3>

      {/* Curved seams */}
      <button
        type="button"
        onClick={() => props.setCurvedSeams((v) => !v)}
        className={`w-full glass-panel rounded-xl p-4 text-left transition-colors ${
          props.curvedSeams ? 'border-primary' : ''
        }`}
      >
        <p className="text-body-md font-medium text-on-surface">
          Does this quilt have curved seams?
        </p>
        <p className="text-body-sm text-secondary mt-1">
          Drunkard&apos;s Path, Orange Peel, Wedding Ring, Clamshell
        </p>
      </button>

      {/* Appliqu\u00e9 */}
      <button
        type="button"
        onClick={() => props.setApplique((v) => !v)}
        className={`w-full glass-panel rounded-xl p-4 text-left transition-colors ${
          props.applique ? 'border-primary' : ''
        }`}
      >
        <p className="text-body-md font-medium text-on-surface">
          Are there shapes sewn on top of the background?
        </p>
        <p className="text-body-sm text-secondary mt-1">
          Needle-turn appliqu\u00e9, raw-edge appliqu\u00e9, fused shapes
        </p>
      </button>

      {/* Touching fabrics */}
      <button
        type="button"
        onClick={() => props.setTouchingFabrics((v) => !v)}
        className={`w-full glass-panel rounded-xl p-4 text-left transition-colors ${
          props.touchingFabrics ? 'border-primary' : ''
        }`}
      >
        <p className="text-body-md font-medium text-on-surface">
          Are there pieces of the exact same fabric sewn touching each other?
        </p>
      </button>

      {/* Heavy quilting */}
      <button
        type="button"
        onClick={() => props.setHeavyQuilting((v) => !v)}
        className={`w-full glass-panel rounded-xl p-4 text-left transition-colors ${
          props.heavyQuilting ? 'border-primary' : ''
        }`}
      >
        <p className="text-body-md font-medium text-on-surface">
          Is there heavy quilting or embroidery over the pieces?
        </p>
      </button>

      {/* Piece scale selector */}
      <div className="space-y-2">
        <p className="text-body-md font-medium text-on-surface">
          How big are the pieces generally?
        </p>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => props.setPieceScale('tiny')}
            className={`glass-panel rounded-xl p-3 text-center transition-colors ${
              props.pieceScale === 'tiny' ? 'border-primary' : ''
            }`}
          >
            <p className="text-body-sm font-medium text-on-surface">Tiny / Postage Stamp</p>
            <p className="text-label-xs text-secondary mt-1">Pieces under 2&quot;</p>
          </button>
          <button
            type="button"
            onClick={() => props.setPieceScale('standard')}
            className={`glass-panel rounded-xl p-3 text-center transition-colors ${
              props.pieceScale === 'standard' ? 'border-primary' : ''
            }`}
          >
            <p className="text-body-sm font-medium text-on-surface">Standard</p>
            <p className="text-label-xs text-secondary mt-1">Pieces 2&quot;-6&quot;</p>
          </button>
          <button
            type="button"
            onClick={() => props.setPieceScale('large')}
            className={`glass-panel rounded-xl p-3 text-center transition-colors ${
              props.pieceScale === 'large' ? 'border-primary' : ''
            }`}
          >
            <p className="text-body-sm font-medium text-on-surface">Large / Chunky</p>
            <p className="text-label-xs text-secondary mt-1">
              Big pieces, 6&quot;+ — like modern quilt blocks
            </p>
          </button>
        </div>
      </div>

      <p className="text-body-sm text-secondary text-center">
        Default settings work well for most quilts.
      </p>

      <button
        type="button"
        onClick={props.onContinue}
        className="w-full rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Analyze Quilt
      </button>
    </div>
  );
}

function ProcessingStep() {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <div className="space-y-2">
        <h3 className="text-headline-sm font-semibold text-on-surface">Analyzing your quilt</h3>
        <p className="text-body-md text-secondary">
          Detecting pieces and extracting the pattern...
        </p>
      </div>
    </div>
  );
}

function CompleteStep({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-6 text-center py-8">
      <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-success">
          <path
            d="M8 16L14 22L24 10"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h3 className="text-headline-sm font-semibold text-on-surface">Pattern extracted!</h3>
      <p className="text-body-md text-secondary">
        Your quilt pieces have been detected. You can now assign fabrics and export to the studio.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full bg-gradient-to-r from-primary to-primary-dark px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
      >
        Open in Studio
      </button>
    </div>
  );
}
