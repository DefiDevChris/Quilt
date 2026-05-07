'use client';

import { useState, useCallback } from 'react';
import { FileDown } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { computeCanvasYardage } from '@/lib/yardage-calculator';
import { generatePrintListPdf } from '@/lib/printlist/generate';
import { useToast } from '@/components/ui/ToastProvider';
import {
  extractBlocksFromFabricObjects,
  computeQuiltLayout,
  extractPieceSizeInches,
} from '@/lib/photo-to-quilt/fabric-to-blocks';

export function PrintListButton() {
  const projectId = useProjectStore((s) => s.projectId);
  const projectName = useProjectStore((s) => s.projectName);
  const projectMode = useProjectStore((s) => s.mode);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const fabricPresets = useProjectStore((s) => s.fabricPresets);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    if (!projectId) {
      setError('No project ID found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fabricCanvas = useCanvasStore.getState().fabricCanvas as {
        getObjects(): Record<string, unknown>[];
      } | null;
      const canvas = fabricCanvas;
      const yardage = computeCanvasYardage({
        canvas: fabricCanvas,
        quiltWidth: canvasWidth,
        quiltHeight: canvasHeight,
        wof: 42,
        lookupFabric: (id) => {
          const preset = fabricPresets?.find((f) => f.id === id);
          return preset ? { name: preset.name, thumbnailUrl: preset.imageUrl } : undefined;
        },
      });

      const objects = canvas?.getObjects() ?? [];
      const blocks = extractBlocksFromFabricObjects(objects);
      const quiltLayout = computeQuiltLayout(blocks);

      const extractedPieceSize = extractPieceSizeInches(objects);
      const pieceSizeInches = extractedPieceSize ?? (canvasWidth / (quiltLayout.cols * 3));

      const pdfBytes = await generatePrintListPdf({
        projectName: projectName || 'Untitled Quilt',
        finishedSize: { width: canvasWidth, height: canvasHeight },
        palette: yardage.fabrics.map((f) => ({ hex: f.fillColor, name: f.displayName })),
        yardage,
        cutList: yardage.fabrics.map((f) => ({
          fabricName: f.displayName,
          hex: f.fillColor,
          cutInstructions: f.cutInstructions,
          totalYardage: f.yardsRequired,
          wof: 42,
        })),
        blocks,
        quiltLayout,
        pieceSizeInches,
        paperSize: 'letter',
      });

      const blob = new Blob([pdfBytes as unknown as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName || 'quilt'}-print-list.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      toast({ type: 'success', title: 'PDF downloaded' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate print list';
      setError(message);
      toast({ type: 'error', title: 'Error', description: message });
    } finally {
      setLoading(false);
    }
  }, [projectId, projectName, canvasWidth, canvasHeight, fabricPresets, toast]);

  if (projectMode !== 'photo-to-quilt') return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] leading-[18px] font-medium text-[var(--color-text)]/80 hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors duration-150 disabled:opacity-50"
        aria-label="Download print list PDF"
      >
        <FileDown size={14} />
        {loading ? 'Generating...' : 'Print List'}
      </button>
      {error && <span className="text-[12px] text-red-500">{error}</span>}
    </div>
  );
}
