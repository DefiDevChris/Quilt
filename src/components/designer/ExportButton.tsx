'use client';

import { useState, useCallback } from 'react';
import {
  exportCanvasImage,
  generateImageFilename,
  downloadImage,
  type ImageFormat,
} from '@/lib/image-exporter';

interface ExportButtonProps {
  fabricCanvas: unknown;
  projectName: string;
}

export function ExportButton({ fabricCanvas, projectName }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ImageFormat>('png');
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    if (!fabricCanvas) return;

    setIsExporting(true);
    setError(null);

    try {
      // Use the client-side image exporter
      const blob = await exportCanvasImage(fabricCanvas, {
        dpi: 150,
        format,
        projectName,
      });

      const filename = generateImageFilename(projectName, 150, format);
      downloadImage(blob, filename);
      setIsOpen(false);
    } catch (err) {
      console.error('Export failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to export image');
    } finally {
      setIsExporting(false);
    }
  }, [fabricCanvas, format, projectName]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-[#ff8d49] text-[#1a1a1a] px-6 py-2 rounded-full hover:bg-[#e67d3f]"
        aria-label="Export"
      >
        Export
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label="Export design"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-medium text-[#1a1a1a] mb-4">Export Design</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="export-format" className="block text-sm text-[#4a4a4a] mb-1">
                  Format
                </label>
                <select
                  id="export-format"
                  value={format}
                  onChange={(e) => setFormat(e.target.value as ImageFormat)}
                  className="w-full rounded-lg border border-[#d4d4d4] px-3 py-2 text-[#1a1a1a] bg-white"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPEG</option>
                </select>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="border-2 border-[#ff8d49] text-[#ff8d49] rounded-full hover:bg-[#ff8d49]/10 px-6 py-2"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="bg-[#ff8d49] text-[#1a1a1a] px-6 py-2 rounded-full hover:bg-[#e67d3f] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
