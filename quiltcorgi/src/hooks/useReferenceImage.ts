'use client';

import { useState, useCallback, useMemo } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { isValidImageType, clampOpacity } from '@/lib/image-tracing-utils';
import { REFERENCE_IMAGE_DEFAULT_OPACITY } from '@/lib/constants';

export interface UseReferenceImageReturn {
  readonly hasImage: boolean;
  readonly isVisible: boolean;
  readonly isLocked: boolean;
  readonly importImage: (file: File) => Promise<void>;
  readonly removeImage: () => void;
  readonly setOpacity: (opacity: number) => void;
  readonly toggleVisibility: () => void;
  readonly toggleLock: () => void;
  readonly fitToCanvas: () => void;
}

interface ReferenceImageState {
  readonly hasImage: boolean;
  readonly isVisible: boolean;
  readonly isLocked: boolean;
}

const INITIAL_STATE: ReferenceImageState = {
  hasImage: false,
  isVisible: true,
  isLocked: true,
};

/**
 * Finds the reference image object on the Fabric.js canvas.
 * Returns null if no reference image exists.
 */
async function findReferenceImage(
  fabricCanvas: unknown
): Promise<unknown | null> {
  if (!fabricCanvas) return null;

  const fabric = await import('fabric');
  const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
  const objects = canvas.getObjects();

  return (
    objects.find((obj) => {
      const data = obj as unknown as { isReferenceImage?: boolean };
      return data.isReferenceImage === true;
    }) ?? null
  );
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function useReferenceImage(): UseReferenceImageReturn {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const setReferenceImageOpacity = useCanvasStore((s) => s.setReferenceImageOpacity);

  const [state, setState] = useState<ReferenceImageState>(INITIAL_STATE);

  const importImage = useCallback(
    async (file: File): Promise<void> => {
      if (!fabricCanvas) {
        throw new Error('Canvas is not initialized');
      }
      if (!isValidImageType(file.type)) {
        throw new Error(`Unsupported image type: ${file.type}`);
      }

      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      // Remove any existing reference image first
      const existing = await findReferenceImage(fabricCanvas);
      if (existing) {
        canvas.remove(existing as InstanceType<typeof fabric.FabricObject>);
      }

      const dataUrl = await readFileAsDataURL(file);
      const img = await fabric.FabricImage.fromURL(dataUrl, { crossOrigin: 'anonymous' });

      // Mark as reference image and configure as non-interactive by default
      const imgObj = img as unknown as Record<string, unknown>;
      imgObj.isReferenceImage = true;

      img.set({
        selectable: false,
        evented: false,
        opacity: REFERENCE_IMAGE_DEFAULT_OPACITY,
        excludeFromExport: true,
      });

      canvas.add(img);
      canvas.sendObjectToBack(img);
      canvas.renderAll();

      setReferenceImageOpacity(REFERENCE_IMAGE_DEFAULT_OPACITY);
      setState({
        hasImage: true,
        isVisible: true,
        isLocked: true,
      });
    },
    [fabricCanvas, setReferenceImageOpacity]
  );

  const removeImage = useCallback(async () => {
    if (!fabricCanvas) return;

    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const refImage = await findReferenceImage(fabricCanvas);

    if (refImage) {
      canvas.remove(refImage as InstanceType<typeof fabric.FabricObject>);
      canvas.renderAll();
    }

    setState(INITIAL_STATE);
  }, [fabricCanvas]);

  const setOpacity = useCallback(
    async (opacity: number) => {
      if (!fabricCanvas) return;

      const clamped = clampOpacity(opacity);
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const refImage = await findReferenceImage(fabricCanvas);

      if (refImage) {
        (refImage as InstanceType<typeof fabric.FabricObject>).set({
          opacity: clamped,
        });
        canvas.renderAll();
      }

      setReferenceImageOpacity(clamped);
    },
    [fabricCanvas, setReferenceImageOpacity]
  );

  const toggleVisibility = useCallback(async () => {
    if (!fabricCanvas) return;

    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const refImage = await findReferenceImage(fabricCanvas);

    if (refImage) {
      const obj = refImage as InstanceType<typeof fabric.FabricObject>;
      const newVisible = !obj.visible;
      obj.set({ visible: newVisible });
      canvas.renderAll();

      setState((prev) => ({ ...prev, isVisible: newVisible }));
    }
  }, [fabricCanvas]);

  const toggleLock = useCallback(async () => {
    if (!fabricCanvas) return;

    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const refImage = await findReferenceImage(fabricCanvas);

    if (refImage) {
      const obj = refImage as InstanceType<typeof fabric.FabricObject>;
      const isCurrentlyLocked = !obj.selectable;
      obj.set({
        selectable: isCurrentlyLocked,
        evented: isCurrentlyLocked,
      });
      canvas.renderAll();

      setState((prev) => ({ ...prev, isLocked: !isCurrentlyLocked }));
    }
  }, [fabricCanvas]);

  const fitToCanvas = useCallback(async () => {
    if (!fabricCanvas) return;

    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const refImage = await findReferenceImage(fabricCanvas);

    if (refImage) {
      const obj = refImage as InstanceType<typeof fabric.FabricImage>;
      const canvasWidth = canvas.getWidth();
      const canvasHeight = canvas.getHeight();
      const imgWidth = obj.width ?? 1;
      const imgHeight = obj.height ?? 1;

      const scaleX = canvasWidth / imgWidth;
      const scaleY = canvasHeight / imgHeight;
      const scale = Math.min(scaleX, scaleY);

      obj.set({
        scaleX: scale,
        scaleY: scale,
        left: (canvasWidth - imgWidth * scale) / 2,
        top: (canvasHeight - imgHeight * scale) / 2,
      });

      canvas.sendObjectToBack(obj);
      canvas.renderAll();
    }
  }, [fabricCanvas]);

  return useMemo(
    () => ({
      hasImage: state.hasImage,
      isVisible: state.isVisible,
      isLocked: state.isLocked,
      importImage,
      removeImage,
      setOpacity,
      toggleVisibility,
      toggleLock,
      fitToCanvas,
    }),
    [state, importImage, removeImage, setOpacity, toggleVisibility, toggleLock, fitToCanvas]
  );
}
