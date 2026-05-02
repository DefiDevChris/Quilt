'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { usePhotoToQuiltStore } from '@/stores/photoToQuiltStore';
import {
  loadHtmlImage,
  getCanvasImageData,
  createMaskFromAlpha,
  refineAiMask,
  MAX_WORKING_SIZE,
} from '@/lib/photo-to-quilt/processing';

export default function WizardStepBackground() {
  const pendingFile = usePhotoToQuiltStore((s) => s.pendingFile);
  const removeBackground = usePhotoToQuiltStore((s) => s.removeBackground);
  const isRemovingBg = usePhotoToQuiltStore((s) => s.isRemovingBg);
  const bgProgress = usePhotoToQuiltStore((s) => s.bgProgress);
  const previewUrl = usePhotoToQuiltStore((s) => s.previewUrl);

  const setRemoveBackground = usePhotoToQuiltStore((s) => s.setRemoveBackground);
  const setIsRemovingBg = usePhotoToQuiltStore((s) => s.setIsRemovingBg);
  const setBgProgress = usePhotoToQuiltStore((s) => s.setBgProgress);
  const setImage = usePhotoToQuiltStore((s) => s.setImage);
  const setImageName = usePhotoToQuiltStore((s) => s.setImageName);
  const setWorkingSize = usePhotoToQuiltStore((s) => s.setWorkingSize);
  const setMask = usePhotoToQuiltStore((s) => s.setMask);
  const setPreviewUrl = usePhotoToQuiltStore((s) => s.setPreviewUrl);
  const setPendingFile = usePhotoToQuiltStore((s) => s.setPendingFile);
  const setWizardStep = usePhotoToQuiltStore((s) => s.setWizardStep);

  const [error, setError] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setThumbnailUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setThumbnailUrl(url);
    return () => { URL.revokeObjectURL(url); };
  }, [pendingFile]);

  const handleBack = useCallback(() => {
    if (previewUrl) {
      try { URL.revokeObjectURL(previewUrl); } catch {}
    }
    usePhotoToQuiltStore.getState().resetAll();
  }, [previewUrl]);

  const handleNext = useCallback(async () => {
    const file = pendingFile;
    if (!file) return;

    setIsRemovingBg(true);
    setBgProgress(0);
    setError(null);

    let origUrl: string | null = null;
    let procUrl: string | null = null;

    try {
      origUrl = URL.createObjectURL(file);

      if (removeBackground) {
        try {
          const { removeBackground: removeBg } = await import('@imgly/background-removal');
          const blob = await removeBg(file, {
            publicPath: 'https://unpkg.com/@imgly/background-removal@1.7.0/dist/',
            output: { format: 'image/png', quality: 1 },
            progress: (_key: string, cur: number, tot: number) => {
              if (tot) setBgProgress(Math.round((cur / tot) * 100));
            },
          });
          procUrl = URL.createObjectURL(blob);
          const img = await loadHtmlImage(procUrl);
          const scale = Math.min(1, MAX_WORKING_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.round(img.naturalWidth * scale);
          const h = Math.round(img.naturalHeight * scale);
          const idata = getCanvasImageData(img, w, h);
          const am = createMaskFromAlpha(idata);
          const refined = refineAiMask(am, w, h);
          setImage(img);
          setImageName(file.name.replace(/\.[^.]+$/, ''));
          setWorkingSize({ width: w, height: h });
          setMask(refined);
          setPreviewUrl(procUrl);
          procUrl = null;
          URL.revokeObjectURL(origUrl);
          origUrl = null;
        } catch {
          if (procUrl) { URL.revokeObjectURL(procUrl); procUrl = null; }
          const img = await loadHtmlImage(origUrl!);
          const scale = Math.min(1, MAX_WORKING_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
          const w = Math.round(img.naturalWidth * scale);
          const h = Math.round(img.naturalHeight * scale);
          const idata = getCanvasImageData(img, w, h);
          const m = new Uint8Array(w * h).fill(1);
          setImage(img);
          setImageName(file.name.replace(/\.[^.]+$/, ''));
          setWorkingSize({ width: w, height: h });
          setMask(m);
          setPreviewUrl(origUrl!);
          origUrl = null;
        }
      } else {
        const img = await loadHtmlImage(origUrl!);
        const scale = Math.min(1, MAX_WORKING_SIZE / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * scale);
        const h = Math.round(img.naturalHeight * scale);
        const idata = getCanvasImageData(img, w, h);
        const m = new Uint8Array(w * h).fill(1);
        setImage(img);
        setImageName(file.name.replace(/\.[^.]+$/, ''));
        setWorkingSize({ width: w, height: h });
        setMask(m);
        setPreviewUrl(origUrl!);
        origUrl = null;
      }

      setPendingFile(null);
      setWizardStep('canvas');
    } catch {
      setError('Could not load the image. Please try a different file.');
    } finally {
      setIsRemovingBg(false);
      if (origUrl) URL.revokeObjectURL(origUrl);
      if (procUrl) URL.revokeObjectURL(procUrl);
    }
  }, [pendingFile, removeBackground, setIsRemovingBg, setBgProgress, setImage, setImageName, setWorkingSize, setMask, setPreviewUrl, setPendingFile, setWizardStep]);


  return (
    <div className="flex-1 min-h-0 flex items-center justify-center bg-[var(--color-bg)] p-8">
      <div className="w-full max-w-lg">
        <div className="card p-6">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold tracking-tight text-[var(--color-text)] mb-6">
            Background Settings
          </h2>

          <div className="flex items-center justify-center mb-6 rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)]" style={{ maxHeight: 280 }}>
            {thumbnailUrl && (
              <img
                src={thumbnailUrl}
                alt="Preview"
                className="max-h-[280px] max-w-full object-contain"
                onLoad={() => { if (thumbnailUrl?.startsWith('blob:')) URL.revokeObjectURL(thumbnailUrl); }}
              />
            )}
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] cursor-pointer hover:bg-[var(--color-border)] transition-colors duration-150">
            <input
              type="checkbox"
              checked={removeBackground}
              onChange={(e) => setRemoveBackground(e.target.checked)}
              disabled={isRemovingBg}
              className="w-5 h-5 accent-[var(--color-primary)] cursor-pointer"
            />
            <div>
              <span className="block text-sm font-semibold text-[var(--color-text)]">
                Remove background automatically
              </span>
              <span className="block text-xs text-[var(--color-text-dim)] mt-0.5">
                Keeps just the subject — transparent areas become appliqu&eacute; over your studio background
              </span>
            </div>
          </label>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {isRemovingBg && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
              <span className="text-sm font-semibold text-[var(--color-text)]">
                Removing background… {bgProgress}%
              </span>
              <div className="w-full h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-200"
                  style={{ width: `${bgProgress}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              className="btn-secondary flex items-center gap-1.5"
              onClick={handleBack}
              disabled={isRemovingBg}
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={handleNext}
              disabled={isRemovingBg}
            >
              {isRemovingBg ? 'Processing…' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
