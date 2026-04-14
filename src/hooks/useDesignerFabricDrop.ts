'use client';

import { useCallback, useRef } from 'react';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useDesignerStore } from '@/stores/designerStore';
import { showDropHighlight, clearDropHighlight } from '@/lib/drop-highlight';
import { CANVAS } from '@/lib/design-system';

const FABRIC_HIGHLIGHT_COLOR = CANVAS.fabricHighlight;

/** Roles that accept fabric drops in the designer. */
const DESIGNER_ALLOWED_ROLES = ['sashing', 'border'] as const;

/**
 * Simplified fabric drop hook for the designer route.
 * Handles drop on sashing and border fence areas only.
 * Applies fabric.Pattern fill to fence Rects. Stores fabricId/fabricUrl.
 * Supports both library drag AND quick-apply click.
 */
export function useDesignerFabricDrop() {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();
  const highlightRectRef = useRef<import('fabric').FabricObject | null>(null);

  const clearHighlight = useCallback(() => {
    clearDropHighlight(fabricCanvas, highlightRectRef.current);
    highlightRectRef.current = null;
  }, [fabricCanvas]);

  const showFabricHighlight = useCallback(
    async (target: unknown) => {
      if (!fabricCanvas || !target) return;
      clearHighlight();
      highlightRectRef.current = await showDropHighlight(
        fabricCanvas,
        target,
        FABRIC_HIGHLIGHT_COLOR
      );
    },
    [fabricCanvas, clearHighlight]
  );

  /** Apply a fabric pattern to a fence object on the canvas. */
  const applyFabricToFence = useCallback(
    async (fenceObj: unknown, fabricId: string, imageUrl: string) => {
      if (!fabricCanvas) return;

      const fabricModule = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabricModule.Canvas>;

      try {
        // Load the image and create a pattern
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = imageUrl;
        });

        const pattern = new fabricModule.Pattern({ source: img, repeat: 'repeat' });
        const obj = fenceObj as unknown as InstanceType<typeof fabricModule.FabricObject>;

        obj.set('fill', pattern);
        canvas.renderAll();

        // Track fabric metadata on the fence object
        const record = obj as unknown as Record<string, unknown>;
        record.fabricId = fabricId;
        record.fabricUrl = imageUrl;
      } catch {
        // Pattern application failed — silently continue
      }
    },
    [fabricCanvas]
  );

  /** Drag start handler for library fabrics. */
  const handleFabricDragStart = useCallback((e: React.DragEvent, fabricId: string) => {
    e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabricId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  /** Drag over handler — highlight valid drop targets. */
  const handleFabricDragOver = useCallback(
    async (e: React.DragEvent) => {
      const hasFabricData =
        e.dataTransfer.types.includes('application/quiltcorgi-fabric-id') ||
        e.dataTransfer.types.includes('application/quiltcorgi-fabric-hex');
      if (!hasFabricData) return;
      e.preventDefault();

      if (fabricCanvas) {
        const fabric = fabricCanvas as unknown as { findTarget: (e: MouseEvent) => unknown };
        const foundTarget = fabric.findTarget(e.nativeEvent as unknown as MouseEvent);
        if (foundTarget) {
          const areaObj = foundTarget as Record<string, unknown>;
          if (
            areaObj['_fenceElement'] &&
            DESIGNER_ALLOWED_ROLES.includes(
              areaObj['_fenceRole'] as (typeof DESIGNER_ALLOWED_ROLES)[number]
            )
          ) {
            e.dataTransfer.dropEffect = 'copy';
            await showFabricHighlight(foundTarget);
            return;
          }
        }
      }
      e.dataTransfer.dropEffect = 'none';
      clearHighlight();
    },
    [fabricCanvas, showFabricHighlight, clearHighlight]
  );

  /** Drop handler — applies fabric to sashing/border fence areas. */
  const handleFabricDrop = useCallback(
    async (e: React.DragEvent) => {
      const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');
      const fabricHex = e.dataTransfer.getData('application/quiltcorgi-fabric-hex');
      const imageUrl = e.dataTransfer.getData('application/quiltcorgi-fabric-url');
      const fabricName = e.dataTransfer.getData('application/quiltcorgi-fabric-name');

      if (!fabricCanvas) {
        clearHighlight();
        return;
      }

      const canvas = fabricCanvas as unknown as { findTarget: (e: MouseEvent) => unknown };
      const foundTarget = canvas.findTarget(e.nativeEvent);

      if (!foundTarget) {
        clearHighlight();
        return;
      }

      const areaObj = foundTarget as Record<string, unknown>;

      // Only accept drops on sashing or border fence areas
      const isAllowedRole =
        areaObj['_fenceElement'] &&
        DESIGNER_ALLOWED_ROLES.includes(
          areaObj['_fenceRole'] as (typeof DESIGNER_ALLOWED_ROLES)[number]
        );

      if (!isAllowedRole) {
        clearHighlight();
        return;
      }

      const role = areaObj['_fenceRole'] as string;

      // Handle quick-apply hex colors (solid color fill)
      if (fabricHex && !fabricId) {
        (foundTarget as { set: (key: string, value: unknown) => void }).set('fill', fabricHex);
        (canvas as { renderAll?: () => void }).renderAll?.();

        // Update the designer store based on role
        if (role === 'sashing') {
          useDesignerStore
            .getState()
            .setSashing(
              useDesignerStore.getState().sashingWidth,
              fabricName || 'quick-apply',
              null
            );
        } else if (role === 'border') {
          const borderIndex = (areaObj['_fenceBorderIndex'] as number) ?? 0;
          const borders = useDesignerStore.getState().borders;
          if (borders[borderIndex]) {
            const updated = [...borders];
            updated[borderIndex] = {
              ...updated[borderIndex],
              fabricId: fabricName || 'quick-apply',
              fabricUrl: null,
            };
            useDesignerStore.getState().setBorders(updated);
          }
        }

        clearHighlight();
        return;
      }

      // Handle library fabric drop
      if (!fabricId || !imageUrl) {
        clearHighlight();
        return;
      }

      await applyFabricToFence(foundTarget, fabricId, imageUrl);

      // Update the designer store based on role
      if (role === 'sashing') {
        useDesignerStore
          .getState()
          .setSashing(useDesignerStore.getState().sashingWidth, fabricId, imageUrl);
      } else if (role === 'border') {
        const borderIndex = (areaObj['_fenceBorderIndex'] as number) ?? 0;
        const borders = useDesignerStore.getState().borders;
        if (borders[borderIndex]) {
          const updated = [...borders];
          updated[borderIndex] = {
            ...updated[borderIndex],
            fabricId,
            fabricUrl: imageUrl,
          };
          useDesignerStore.getState().setBorders(updated);
        }
      }

      clearHighlight();
    },
    [fabricCanvas, applyFabricToFence, clearHighlight]
  );

  /** Drag leave handler — clear highlight. */
  const handleFabricDragLeave = useCallback(() => {
    clearHighlight();
  }, [clearHighlight]);

  return {
    handleFabricDragStart,
    handleFabricDragOver,
    handleFabricDrop,
    handleFabricDragLeave,
  };
}
