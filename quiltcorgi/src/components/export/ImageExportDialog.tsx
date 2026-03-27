'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import {
  exportCanvasImage,
  generateImageFilename,
  downloadImage,
  DPI_OPTIONS,
  type DpiOption,
  type ImageFormat,
} from '@/lib/image-exporter';

interface ImageExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageExportDialog({ isOpen, onClose }: ImageExportDialogProps) {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const projectName = useProjectStore((s) => s.projectName);
  const [dpi, setDpi] = useState<DpiOption>(300);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = useCallback(async () => {
    if (!fabricCanvas) return;

    setIsExporting(true);
    setError('');

    try {
      const blob = await exportCanvasImage(fabricCanvas, {
        dpi,
        format,
        projectName: projectName ?? 'quilt',
      });
      const filename = generateImageFilename(projectName ?? 'quilt', dpi, format);
      downloadImage(blob, filename);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export image');
    } finally {
      setIsExporting(false);
    }
  }, [fabricCanvas, dpi, format, projectName, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[380px] rounded-xl bg-surface p-6 shadow-elevation-3">
        <h2 className="text-lg font-semibold text-on-surface mb-4">Export Image</h2>

        {/* DPI Selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-on-surface block mb-1">Resolution (DPI)</label>
          <div className="grid grid-cols-4 gap-2">
            {DPI_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setDpi(opt)}
                className={`rounded-md border px-2 py-2 text-xs font-medium transition-colors ${
                  dpi === opt
                    ? 'border-primary bg-primary text-white'
                    : 'border-outline-variant bg-white text-on-surface hover:bg-background'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-secondary mt-1">
            {dpi === 72 && 'Screen resolution — smallest file'}
            {dpi === 150 && 'Good for sharing online'}
            {dpi === 300 && 'Print quality — recommended'}
            {dpi === 600 && 'High-res print — large file'}
          </p>
        </div>

        {/* Format Selector */}
        <div className="mb-4">
          <label className="text-xs font-medium text-on-surface block mb-1">Format</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormat('png')}
              className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                format === 'png'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant bg-white text-on-surface hover:bg-background'
              }`}
            >
              PNG (lossless)
            </button>
            <button
              type="button"
              onClick={() => setFormat('jpeg')}
              className={`rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                format === 'jpeg'
                  ? 'border-primary bg-primary text-white'
                  : 'border-outline-variant bg-white text-on-surface hover:bg-background'
              }`}
            >
              JPEG (smaller)
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-xs text-error mb-3">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-md border border-outline-variant bg-white px-4 py-2 text-sm text-on-surface hover:bg-background"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !fabricCanvas}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Exporting...
              </>
            ) : (
              'Export & Download'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
