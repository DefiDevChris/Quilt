'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import type { PhotoDesignClient } from '@/lib/photo-to-design/client';
import type { Point } from '@/types/photo-to-design';
import { QuiltCanvas } from '@/components/photo-to-design/components/QuiltCanvas';
import { SliderPanel } from '@/components/photo-to-design/components/SliderPanel';
import { Toolbar } from '@/components/photo-to-design/components/Toolbar';
import { TemplateList } from '@/components/photo-to-design/components/TemplateList';
import { buildStudioImportPayload, createPhotoProject } from '@/lib/photo-to-design/export';

interface ReviewScreenProps {
  client: PhotoDesignClient | null;
}

export function ReviewScreen({ client }: ReviewScreenProps) {
  const router = useRouter();

  const patches = usePhotoDesignStore((s) => s.patches);
  const templates = usePhotoDesignStore((s) => s.templates);
  const grid = usePhotoDesignStore((s) => s.grid);
  const calibrationUnit = usePhotoDesignStore((s) => s.calibrationUnit);
  const activeTool = usePhotoDesignStore((s) => s.activeTool);
  const selectedPatchId = usePhotoDesignStore((s) => s.selectedPatchId);
  const setSelectedPatchId = usePhotoDesignStore((s) => s.setSelectedPatchId);
  const setHoveredPatchId = usePhotoDesignStore((s) => s.setHoveredPatchId);
  const isProcessing = usePhotoDesignStore((s) => s.isProcessing);
  const processingStage = usePhotoDesignStore((s) => s.processingStage);
  const processingPercent = usePhotoDesignStore((s) => s.processingPercent);
  const previewPatchCount = usePhotoDesignStore((s) => s.previewPatchCount);
  const dispose = usePhotoDesignStore((s) => s.dispose);

  const [isExporting, setIsExporting] = useState(false);

  const handlePatchClick = useCallback(
    (patchId: number, point: Point) => {
      switch (activeTool) {
        case 'select':
        case null:
          setSelectedPatchId(patchId === selectedPatchId ? null : patchId);
          break;
        case 'eraseSeam': {
          // Single-click boundary pick: ask the worker to sample the label
          // map on both sides of the click and return the two patch IDs.
          // Falls back to the clicked patch + selected pair if the click
          // didn't land near a real boundary.
          if (!client) break;
          client
            .findSeamPair(point)
            .then(({ pair }) => {
              if (pair) {
                client.mergePatches(pair.aId, pair.bId);
              } else if (selectedPatchId !== null && selectedPatchId !== patchId) {
                client.mergePatches(selectedPatchId, patchId);
              } else {
                setSelectedPatchId(patchId);
              }
            })
            .catch(() => {
              /* error is already surfaced by the worker */
            });
          break;
        }
        case 'floodFill': {
          // Reassign clicked region to the currently selected patch's ID.
          if (selectedPatchId === null) {
            setSelectedPatchId(patchId);
          } else if (selectedPatchId !== patchId) {
            client?.floodFill(point, selectedPatchId);
          }
          break;
        }
        case 'drawSeam':
          // Drag produces the line via onDrawSeamLine; click alone does nothing.
          break;
      }
    },
    [activeTool, selectedPatchId, setSelectedPatchId, client]
  );

  const handleDrawSeamLine = useCallback(
    (start: Point, end: Point) => {
      if (!client) return;
      // Determine which patch the stroke started on.
      const startPatch = patches?.find((p) => pointInPolygon(start, p.pixelPolygon));
      if (!startPatch) return;
      client.splitPatch(startPatch.id, [start, end]);
    },
    [client, patches]
  );

  const handlePatchHover = useCallback(
    (patchId: number | null) => {
      setHoveredPatchId(patchId);
    },
    [setHoveredPatchId]
  );

  const canExport = !!patches && patches.length > 0 && !isExporting;

  const handleExport = useCallback(async () => {
    if (!canExport || !patches || !templates) return;
    setIsExporting(true);
    try {
      // 1. Build payload BEFORE disposing the store (correctedImageUrl is revoked on dispose).
      const payload = buildStudioImportPayload({
        patches,
        templates,
        unit: calibrationUnit,
        gridType: grid?.type ?? 'none',
      });

      // 2. Dispose FIRST so the worker WASM heap frees before navigation.
      await client?.disposeWorker();
      dispose();

      // 3. POST the new project with the payload.
      const { projectId } = await createPhotoProject(payload, 'Photo Import');

      // 4. Navigate to Studio.
      router.push(`/studio/${projectId}`);
    } catch (err) {
      console.error('[Photo-to-Design] export failed:', err);
      usePhotoDesignStore.getState().setError({
        stage: 'export',
        message: err instanceof Error ? err.message : 'Failed to export to Studio.',
        recoverable: true,
      });
      setIsExporting(false);
    }
  }, [canExport, patches, templates, calibrationUnit, grid, client, dispose, router]);

  return (
    <div className="flex h-full flex-col">
      <Toolbar client={client} />

      <div className="flex min-h-0 flex-1">
        {/* Left: canvas */}
        <div className="relative flex-1">
          <QuiltCanvas
            onPatchClick={handlePatchClick}
            onDrawSeamLine={handleDrawSeamLine}
            onPatchHover={handlePatchHover}
          />
          {isProcessing && (
            <div className="pointer-events-none absolute left-4 top-4 rounded-lg border border-[#d4d4d4] bg-[#ffffff]/95 px-3 py-2 text-[13px] text-[#1a1a1a] shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
              <span className="animate-pulse">
                {processingStage || 'Processing'}
                {processingPercent ? ` — ${processingPercent}%` : '…'}
              </span>
            </div>
          )}
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-[#d4d4d4] bg-[#ffffff]/95 px-3 py-1.5 text-[12px] text-[#4a4a4a] shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
            {previewPatchCount || 0} patches
            {grid && grid.type !== 'none' ? ` · ${grid.type} grid` : ''}
          </div>
        </div>

        {/* Right: controls */}
        <aside className="w-[320px] overflow-y-auto border-l border-[#d4d4d4] bg-[#ffffff]">
          <SliderPanel client={client} />
          <div className="border-t border-[#d4d4d4]">
            <TemplateList />
          </div>
          <div className="sticky bottom-0 border-t border-[#d4d4d4] bg-[#ffffff] p-4">
            <button
              type="button"
              onClick={handleExport}
              disabled={!canExport}
              className={`w-full rounded-full px-6 py-3 text-[15px] font-semibold shadow-[0_1px_2px_rgba(26,26,26,0.08)] transition-colors duration-150 ${
                canExport
                  ? 'bg-[#ff8d49] text-[#1a1a1a] hover:bg-[#e67d3f]'
                  : 'cursor-not-allowed bg-[#d4d4d4] text-[#4a4a4a]'
              }`}
            >
              {isExporting ? 'Opening Studio…' : 'Send to Studio'}
            </button>
            {!canExport && !isExporting && (
              <p className="mt-2 text-[12px] text-[#4a4a4a]">
                Waiting for the full analysis pass to finish…
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// Local point-in-polygon (ray cast) — duplicated from QuiltCanvas to avoid
// exporting the helper from a presentation-only component.
function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const intersect =
      yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}
