'use client';

import { useState, useCallback, useRef } from 'react';
import { useReferenceImage } from '@/hooks/useReferenceImage';
import { useCanvasStore } from '@/stores/canvasStore';

interface ReferenceImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReferenceImageDialog({ isOpen, onClose }: ReferenceImageDialogProps) {
  const { hasImage, isVisible, isLocked, importImage, removeImage, setOpacity, toggleVisibility, toggleLock } = useReferenceImage();
  const referenceImageOpacity = useCanvasStore((s) => s.referenceImageOpacity);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setError('');
      try {
        await importImage(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import image');
      }
    },
    [importImage]
  );

  const handleRemove = useCallback(() => {
    removeImage();
    setError('');
  }, [removeImage]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface rounded-lg shadow-elevation-3 w-[400px] max-w-[90vw]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant">
          <h2 className="text-title-lg text-on-surface">Reference Image</h2>
          <p className="text-body-sm text-secondary mt-1">
            Import a photo to trace over — adjust opacity and lock in place
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {error && (
            <div className="px-3 py-2 bg-error/10 border border-error/20 rounded text-body-sm text-error">
              {error}
            </div>
          )}

          {!hasImage ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-3 bg-primary text-white rounded-md hover:opacity-90 transition-opacity"
              >
                Choose Image
              </button>
              <p className="text-body-sm text-secondary mt-2 text-center">
                PNG, JPEG, or WebP
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Opacity Slider */}
              <div>
                <label className="text-body-sm text-on-surface block mb-2">
                  Opacity: {Math.round(referenceImageOpacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={referenceImageOpacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-on-surface">Visible</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isVisible}
                  onClick={toggleVisibility}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                    isVisible ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                      isVisible ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Lock Toggle */}
              <div className="flex items-center justify-between">
                <span className="text-body-sm text-on-surface">Locked</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isLocked}
                  onClick={toggleLock}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
                    isLocked ? 'bg-primary' : 'bg-outline-variant'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 mt-0.5 rounded-full bg-white shadow transition-transform ${
                      isLocked ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={handleRemove}
                className="w-full px-4 py-2 bg-error/10 text-error rounded-md hover:bg-error/20 transition-colors"
              >
                Remove Image
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-surface-container text-on-surface rounded-md hover:bg-surface-container-high transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
