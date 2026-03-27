'use client';

import { useState, useCallback } from 'react';
import { useCanvasStore, type FussyCutTarget } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import {
  computePatternTransform,
  defaultFussyCutConfig,
  clampConfig,
  type FussyCutConfig,
} from '@/lib/fussy-cut-engine';
import { fussyCutConfigSchema } from '@/lib/validation';

interface UseFussyCutReturn {
  isOpen: boolean;
  target: FussyCutTarget | null;
  config: FussyCutConfig;
  openDialog: (target: FussyCutTarget) => void;
  closeDialog: () => void;
  updateConfig: (updates: Partial<FussyCutConfig>) => void;
  applyFussyCut: () => Promise<void>;
}

export function useFussyCut(): UseFussyCutReturn {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const target = useCanvasStore((s) => s.fussyCutTarget);
  const setFussyCutTarget = useCanvasStore((s) => s.setFussyCutTarget);
  const [config, setConfig] = useState<FussyCutConfig>(defaultFussyCutConfig(''));

  const isOpen = target !== null;

  const openDialog = useCallback((newTarget: FussyCutTarget) => {
    setFussyCutTarget(newTarget);
    setConfig(defaultFussyCutConfig(newTarget.fabricId));
  }, [setFussyCutTarget]);

  const closeDialog = useCallback(() => {
    setFussyCutTarget(null);
  }, [setFussyCutTarget]);

  const updateConfig = useCallback((updates: Partial<FussyCutConfig>) => {
    setConfig((prev) => clampConfig({ ...prev, ...updates }));
  }, []);

  const applyFussyCut = useCallback(async () => {
    if (!fabricCanvas || !target) return;

    // Validate config with Zod before applying
    const parsed = fussyCutConfigSchema.safeParse(config);
    if (!parsed.success) return;

    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

    // Find the target object
    const objects = canvas.getObjects();
    const targetObj = objects.find((obj) => {
      const data = obj as unknown as { id?: string };
      return data.id === target.objectId;
    });

    if (!targetObj) return;

    // Apply fussy cut metadata
    (targetObj as unknown as Record<string, unknown>).fussyCut = { ...config };

    // Compute and apply pattern transform
    const matrix = computePatternTransform(config);
    const fill = targetObj.get('fill');
    if (fill && typeof fill !== 'string') {
      (fill as { patternTransform?: unknown }).patternTransform = matrix;
    }

    targetObj.dirty = true;
    canvas.renderAll();

    // Push undo state
    const json = JSON.stringify(canvas.toJSON());
    useCanvasStore.getState().pushUndoState(json);
    useProjectStore.getState().setDirty(true);

    closeDialog();
  }, [fabricCanvas, target, config, closeDialog]);

  return {
    isOpen,
    target,
    config,
    openDialog,
    closeDialog,
    updateConfig,
    applyFussyCut,
  };
}
