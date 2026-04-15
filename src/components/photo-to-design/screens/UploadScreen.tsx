import { useState, useRef, useCallback } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import { readExifOrientation, applyExifOrientation } from '@/lib/photo-to-design/exif';
import { downscaleImage, imageBitmapToObjectUrl } from '@/lib/photo-to-design/image-utils';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const MIN_RESOLUTION = 800;

export function UploadScreen() {
  const setSourceFile = usePhotoDesignStore((s) => s.setSourceFile);
  const setStage = usePhotoDesignStore((s) => s.setStage);
  const setError = usePhotoDesignStore((s) => s.setError);

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [heicError, setHeicError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file type
      if (
        !ACCEPTED_TYPES.includes(file.type) &&
        !file.name.toLowerCase().match(/\.(jpe?g|png|webp|heic|heif)$/)
      ) {
        setError({
          stage: 'upload',
          message: 'Please upload a JPEG, PNG, WebP, or HEIC photo.',
          recoverable: true,
        });
        return;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError({
          stage: 'upload',
          message: 'Photo is too large. Please use an image under 50 MB.',
          recoverable: true,
        });
        return;
      }

      setIsProcessing(true);
      setHeicError(null);

      try {
        // Create object URL for the source file (original)
        const objectUrl = URL.createObjectURL(file);

        // Handle HEIC files
        let imageSource: ImageBitmap;
        if (
          file.type.includes('heic') ||
          file.type.includes('heif') ||
          file.name.toLowerCase().match(/\.heic$/)
        ) {
          try {
            // Dynamic import heic2any only when needed
            const heic2any = (await import('heic2any')).default;
            const blob = await heic2any({
              blob: file,
              toType: 'image/jpeg',
              quality: 0.9,
            });
            const jpegBlob = blob as Blob;
            imageSource = await createImageBitmap(jpegBlob);
          } catch {
            setHeicError(
              'iPhone photo format not supported. Please open this photo on your device, share it as JPEG, and try again.',
            );
            URL.revokeObjectURL(objectUrl);
            setIsProcessing(false);
            return;
          }
        } else {
          imageSource = await createImageBitmap(file);
        }

        // EXIF orientation fix
        const orientation = await readExifOrientation(file);
        if (orientation !== 1) {
          imageSource = await applyExifOrientation(imageSource, orientation);
        }

        // Downscale to max 4096px long edge
        const downscaled = await downscaleImage(imageSource);

        // Create object URL for the downscaled image
        const downscaledUrl = await imageBitmapToObjectUrl(downscaled);

        // Warn if resolution is low
        if (downscaled.width < MIN_RESOLUTION || downscaled.height < MIN_RESOLUTION) {
          setError({
            stage: 'upload',
            message: `Photo resolution is low (${downscaled.width}×${downscaled.height}). Results may be better with higher resolution photos.`,
            recoverable: true,
          });
        }

        // Store in state — both original and downscaled URLs
        setSourceFile(file, objectUrl, { width: downscaled.width, height: downscaled.height }, downscaledUrl);

        // Advance to perspective
        setStage('perspective');
      } catch (err) {
        setError({
          stage: 'upload',
          message: err instanceof Error ? err.message : 'Failed to process image.',
          recoverable: true,
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [setSourceFile, setStage, setError],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile],
  );

  return (
    <div className="flex h-full flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <h2 className="mb-2 text-center text-[32px] leading-[40px] font-semibold text-[#1a1a1a]">
          Upload Your Quilt Photo
        </h2>
        <p className="mb-8 text-center text-[18px] leading-[28px] text-[#4a4a4a]">
          Take a clear photo of your quilt laid flat with good lighting.
        </p>

        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors duration-150 ${
            isDragging
              ? 'border-[#ff8d49] bg-[#ff8d49]/5'
              : 'border-[#d4d4d4] bg-[#ffffff] hover:border-[#ff8d49]'
          }`}
        >
          {/* Upload icon */}
          <svg
            className="mb-4 h-16 w-16 text-[#4a4a4a]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
          <p className="text-[18px] leading-[28px] text-[#1a1a1a]">
            Drop a photo of your quilt here, or tap to browse
          </p>
          <p className="mt-2 text-[14px] leading-[20px] text-[#4a4a4a]">
            JPEG, PNG, WebP, HEIC — up to 50 MB
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.heic,.heif,image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* Mobile: Take Photo button */}
        <div className="mt-4 flex justify-center sm:hidden">
          <button
            type="button"
            onClick={() => mobileInputRef.current?.click()}
            className="bg-[#ff8d49] text-[#1a1a1a] rounded-full px-6 py-3 text-[16px] font-medium shadow-[0_1px_2px_rgba(45,42,38,0.08)] transition-colors duration-150 hover:bg-[#e67d3f]"
          >
            Take Photo
          </button>
          <input
            ref={mobileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileInput}
            className="hidden"
          />
        </div>

        {/* HEIC error message */}
        {heicError && (
          <div className="mt-4 rounded-lg border border-[#d4d4d4] bg-[#ffffff] p-4">
            <p className="text-[14px] leading-[20px] text-[#1a1a1a]">{heicError}</p>
          </div>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="mt-6 flex items-center justify-center">
            <div className="animate-pulse text-[16px] text-[#4a4a4a]">
              Processing your photo...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
