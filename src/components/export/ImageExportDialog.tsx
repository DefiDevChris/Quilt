'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useProjectStore } from '@/stores/projectStore';
import { exportCanvasImage, generateImageFilename, downloadImage, DPI_OPTIONS, type DpiOption, type ImageFormat } from '@/lib/image-exporter';
import { exportCanvasSvg, generateSvgFilename, downloadSvg } from '@/lib/svg-exporter';
import { COLORS } from '@/lib/design-system';
import { ExportDialogShell } from './ExportDialogShell';

type ExportFormat = ImageFormat | 'svg';

interface ImageExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageExportDialog({ isOpen, onClose }: ImageExportDialogProps) {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const projectName = useProjectStore((s) => s.projectName);
  const [dpi, setDpi] = useState<DpiOption>(300);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');

  const handleExport = useCallback(async () => {
    if (!fabricCanvas) return;

    setIsExporting(true);
    setError('');

    try {
      if (format === 'svg') {
        const svgString = await exportCanvasSvg(fabricCanvas, {
          projectName: projectName ?? 'quilt',
          includeBackground: true,
          backgroundColor: COLORS.surface,
        });
        const filename = generateSvgFilename(projectName ?? 'quilt');
        downloadSvg(svgString, filename);
      } else {
        const blob = await exportCanvasImage(fabricCanvas, {
          dpi,
          format: format as ImageFormat,
          projectName: projectName ?? 'quilt',
        });
        const filename = generateImageFilename(projectName ?? 'quilt', dpi, format as ImageFormat);
        downloadImage(blob, filename);
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export image');
    } finally {
      setIsExporting(false);
    }
  }, [fabricCanvas, dpi, format, projectName, onClose]);

  if (!isOpen) return null;

  return (
    <ExportDialogShell
      title="Export Design"
      onExport={handleExport}
      onClose={onClose}
      isExporting={isExporting}
      isDisabled={isExporting || !fabricCanvas}
      exportLabel="Export & Download"
      error={error}
    >
      {/* Format Selector */}
      <div className="mb-4">
        <label id="image-format-label" className="text-xs font-medium text-[var(--color-text)] block mb-1">Format</label>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-labelledby="image-format-label">
          {(['png', 'jpeg', 'svg'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              role="radio"
              aria-checked={format === fmt}
              onClick={() => setFormat(fmt)}
              className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${format === fmt
                ? 'border-primary bg-primary text-white'
                : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-primary)]/10'
                }`}
            >
              {fmt === 'png' ? 'PNG (lossless)' : fmt === 'jpeg' ? 'JPEG (smaller)' : 'SVG (vector)'}
            </button>
          ))}
        </div>
      </div>

      {/* DPI Selector — hidden for SVG */}
      {format !== 'svg' && (
        <div className="mb-4">
          <label id="image-dpi-label" className="text-xs font-medium text-[var(--color-text)] block mb-1">
            Resolution (DPI)
          </label>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-labelledby="image-dpi-label">
            {DPI_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={dpi === opt}
                onClick={() => setDpi(opt)}
                className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${dpi === opt
                  ? 'border-primary bg-primary text-white'
                  : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-primary)]/10'
                  }`}
              >
                {opt}
              </button>
            ))}
          </div>
          <p className="text-caption text-[var(--color-text-dim)] mt-1">
            {dpi === 72 && 'Screen resolution — smallest file'}
            {dpi === 150 && 'Good for sharing online'}
            {dpi === 300 && 'Print quality — recommended'}
            {dpi === 600 && 'High-res print — large file'}
          </p>
        </div>
      )}
    </ExportDialogShell>
  );
}
