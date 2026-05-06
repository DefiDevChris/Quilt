'use client';

import { useState, useCallback } from 'react';
import { FileDown } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { computeCanvasYardage } from '@/lib/yardage-calculator';
import { generatePrintListPdf } from '@/lib/printlist/generate';
import { useToast } from '@/components/ui/ToastProvider';

interface BlockCell {
  color: string;
  hstColor?: string;
  hstOrientation?: 'tl-br' | 'tr-bl' | null;
}

interface BlockData {
  bx: number;
  by: number;
  cells: BlockCell[][]; // 3x3 grid
}

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

  if (projectMode !== 'photo-to-quilt') return null;

  const handleClick = useCallback(async () => {
    if (!projectId) {
      setError('No project ID found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const canvas = useCanvasStore.getState().fabricCanvas;
      const yardage = computeCanvasYardage({
        canvas,
        quiltWidth: canvasWidth,
        quiltHeight: canvasHeight,
        wof: 42,
        lookupFabric: (id) => {
          const preset = fabricPresets?.find((f) => f.id === id);
          return preset ? { name: preset.name, thumbnailUrl: preset.imageUrl } : undefined;
        },
      });

      // Reconstruct blocks from canvas objects
      const blocks: BlockData[] = [];
      const objects = canvas?.getObjects() ?? [];
      
      for (const obj of objects) {
        if (!(obj as any).__isBlockGroup) continue;
        
        const blockGroup = obj as any;
        const { bx, by } = blockGroup.__photoQuiltBlock || {};
        if (bx === undefined || by === undefined) continue;

        // Initialize 3x3 cells with background color
        const cells: BlockCell[][] = Array(3).fill(null).map(() => Array(3).fill(null).map(() => ({ color: '#ffffff' })));
        
        const children = blockGroup._objects ?? blockGroup.getObjects?.() ?? [];
        for (const child of children) {
          if ((child as any).__pieceRole !== 'patch') continue;
          
          const pieceKind = (child as any).__pieceKind as string;
          const { x, y } = (child as any).__photoQuiltCell || {};
          if (x === undefined || y === undefined) continue;
          
          // Compute local coordinates inside the 3x3 block
          const dx = x - bx * 3;
          const dy = y - by * 3;
          if (dx < 0 || dx >= 3 || dy < 0 || dy >= 3) continue;
          
          const fill = (child.fill as string) || '#ffffff';
          
          if (pieceKind === 'square') {
            cells[dy][dx] = { color: fill, hstOrientation: null };
          } else if (pieceKind === 'triangle-a') {
            // triangle-a is TL-BR diagonal (tl-br)
            const existing = cells[dy][dx];
            cells[dy][dx] = {
              color: existing?.hstColor ? existing.color : fill,
              hstColor: existing?.hstColor ? existing.hstColor : fill,
              hstOrientation: 'tl-br',
            };
          } else if (pieceKind === 'triangle-b') {
            // triangle-b is TR-BL diagonal (tr-bl)
            const existing = cells[dy][dx];
            cells[dy][dx] = {
              color: existing?.hstColor ? existing.color : fill,
              hstColor: existing?.hstColor ? existing.hstColor : fill,
              hstOrientation: 'tr-bl',
            };
          }
        }

        blocks.push({ bx, by, cells });
      }

      // Compute quiltLayout from blocks
      const quiltLayout = blocks.length > 0
        ? {
            rows: Math.max(...blocks.map((b) => b.by)) + 1,
            cols: Math.max(...blocks.map((b) => b.bx)) + 1,
          }
        : { rows: 1, cols: 1 };

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
          strips: f.stripCount,
          wof: 42,
        })),
        blocks,
        quiltLayout,
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
  }, [projectId, projectName, canvasWidth, canvasHeight, fabricPresets, toast]);

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
