'use client';

import { useState, useCallback } from 'react';
import { FileDown } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { computeCanvasYardage } from '@/lib/yardage-calculator';
import { generatePrintListPdf } from '@/lib/printlist/generate';
import { useToast } from '@/components/ui/ToastProvider';

export function PrintListButton() {
  const projectId = useProjectStore((s) => s.projectId);
  const projectName = useProjectStore((s) => s.projectName);
  const projectMode = useProjectStore((s) => s.mode);
  const canvasWidth = useProjectStore((s) => s.canvasWidth);
  const canvasHeight = useProjectStore((s) => s.canvasHeight);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (projectMode !== 'photo-to-quilt') return null;

  const handleClick = useCallback(async () => {
    if (!projectId) {
      setError('No project ID found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const canvas = useCanvasStore.getState().fabricCanvas as any;
      const yardage = computeCanvasYardage({
        canvas,
        quiltWidth: canvasWidth,
        quiltHeight: canvasHeight,
        wof: 42,
        lookupFabric: (id) => ({ name: `Fabric ${id}`, thumbnailUrl: null }),
      });

      const printListData = {
        items: yardage.fabrics.map((f) => ({
          fabricId: f.fabricId,
          hex: f.fillColor,
          name: f.displayName,
          cutInstructions: f.cutInstructions,
          yardsRequired: f.yardsRequired,
        })),
        paperSize: 'letter' as const,
      };

      const res = await fetch(`/api/projects/${projectId}/printlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(printListData),
      });

      if (!res.ok) {
        throw new Error('Failed to save print list');
      }

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
          strips: 0,
          wof: 42,
        })),
        blocks: [],
        quiltLayout: { rows: 1, cols: 1 },
        paperSize: 'letter',
      });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
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
  }, [projectId, projectName, canvasWidth, canvasHeight, toast]);

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
