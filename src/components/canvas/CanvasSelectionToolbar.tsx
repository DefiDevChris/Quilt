'use client';

import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { RotateCw, ArrowLeftRight, Palette, Shuffle, Trash2, Minus, Plus, PlusSquare, PaintBucket, Spline, Minimize2 } from 'lucide-react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { getSelectionType, getSelectionBounds, type SelectionType } from '@/lib/selection-utils';
import { useSelectionActions } from '@/hooks/useSelectionActions';

type ToolbarButton = {
  id: string;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

/**
 * Floating selection toolbar — appears above selected canvas objects.
 *
 * Primary edit affordance for the Canva-for-quilts experience.
 * Shows contextual buttons based on selection type (block, border, sashing, patch).
 * Repositions on zoom, pan, and selection changes.
 */
export function CanvasSelectionToolbar(): React.ReactElement | null {
  const { getCanvas } = useCanvasContext();
  const canvas = getCanvas();
  const fabricCanvas = canvas;

  const selectedObjectIds = useCanvasStore((s) => s.selectedObjectIds);
  const zoom = useCanvasStore((s) => s.zoom);
  const swapMode = useCanvasStore((s) => s.swapMode);
  const fabricPickerTarget = useCanvasStore((s) => s.fabricPickerTarget);

  const [selectionType, setSelectionType] = useState<SelectionType>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const actions = useSelectionActions(getCanvas);

  // Update selection type when selection changes
  useEffect(() => {
    if (!fabricCanvas) {
      setSelectionType(null);
      setIsVisible(false);
      return;
    }

    const type = getSelectionType(fabricCanvas);
    setSelectionType(type);
    setIsVisible(type !== null);
  }, [fabricCanvas, selectedObjectIds]);

  // Update position when selection, zoom, or canvas changes
  const updatePosition = useCallback(() => {
    if (!fabricCanvas || !selectionType) {
      setPosition(null);
      return;
    }

    const bounds = getSelectionBounds(fabricCanvas);
    if (!bounds) {
      setPosition(null);
      return;
    }

    // Get canvas container element for relative positioning
    const c = fabricCanvas as { wrapperEl?: HTMLElement; viewportTransform?: number[] };
    const wrapperEl = c.wrapperEl;
    if (!wrapperEl) {
      setPosition(null);
      return;
    }

    const vpt = c.viewportTransform ?? [1, 0, 0, 1, 0, 0];

    // Convert canvas coordinates to screen coordinates
    // bounds is already in canvas coordinates, apply viewport transform
    const screenLeft = bounds.left * vpt[0] + vpt[4];
    const screenTop = bounds.top * vpt[3] + vpt[5];
    const screenWidth = bounds.width * vpt[0];

    // Center horizontally on the selection, position above it
    const toolbarWidth = getToolbarWidth(selectionType);
    const left = screenLeft + screenWidth / 2 - toolbarWidth / 2;
    const top = Math.max(8, screenTop - 48); // 48px above selection (toolbar height + gap)

    setPosition({ left, top });
  }, [fabricCanvas, selectionType, zoom]);

  // Calculate approximate toolbar width based on button count
  function getToolbarWidth(type: SelectionType): number {
    if (!type) return 0;
    const buttonCounts: Record<NonNullable<SelectionType>, number> = {
      block: 5,
      border: 5,
      sashing: 4,
      patch: 2,
      easydraw: 3,
      bent: 4,
    };
    const count = buttonCounts[type] ?? 0;
    // 32px button + 4px gap (approx)
    return count * 36 - 4;
  }

  useEffect(() => {
    updatePosition();
  }, [updatePosition, selectedObjectIds, zoom]);

  // Listen to canvas events for position updates
  useEffect(() => {
    if (!fabricCanvas) return;

    let cleanup: (() => void) | null = null;

    (async () => {
      const fabric = await import('fabric');
      const c = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      const handler = () => updatePosition();

      c.on('object:moving', handler as never);
      c.on('object:scaling', handler as never);
      c.on('object:rotating', handler as never);
      c.on('object:modified', handler as never);
      // Listen to mouse:up to catch viewport changes after pan/zoom
      c.on('mouse:up', handler as never);

      cleanup = () => {
        c.off('object:moving', handler as never);
        c.off('object:scaling', handler as never);
        c.off('object:rotating', handler as never);
        c.off('object:modified', handler as never);
        c.off('mouse:up', handler as never);
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [fabricCanvas, updatePosition]);

  // Handle Escape key to cancel swap mode
  useEffect(() => {
    if (!swapMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        actions.cancelSwap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [swapMode, actions]);

  if (!isVisible || !position || !selectionType) return null;

  const buttons = getToolbarButtons(selectionType, actions, swapMode);

  return (
    <div
      className="absolute z-50 flex items-center gap-1 rounded-full border border-[var(--color-border)]/40 bg-[var(--color-surface)] px-2 py-1.5 shadow-[0_1px_2px_rgba(26,26,26,0.08)]"
      style={{ left: position.left, top: position.top }}
    >
      {buttons.map((button) => (
        <button
          key={button.id}
          type="button"
          onClick={button.onClick}
          disabled={button.disabled}
          aria-label={button.label}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-dim)] transition-colors duration-150 ease-out hover:bg-[var(--color-border)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {button.icon}
        </button>
      ))}
    </div>
  );
}

function getToolbarButtons(
  type: SelectionType,
  actions: ReturnType<typeof useSelectionActions>,
  swapMode: boolean
): ToolbarButton[] {
  const iconProps = { size: 16, strokeWidth: 1.5 };

  switch (type) {
    case 'block':
      return [
        {
          id: 'rotate',
          icon: <RotateCw {...iconProps} />,
          label: 'Rotate 90°',
          onClick: actions.rotate,
        },
        {
          id: 'swap',
          icon: <ArrowLeftRight {...iconProps} />,
          label: swapMode ? 'Tap another block to swap' : 'Swap position',
          onClick: actions.initiateSwap,
          disabled: swapMode,
        },
        {
          id: 'fabric',
          icon: <Palette {...iconProps} />,
          label: 'Apply fabric',
          onClick: actions.openFabricPicker,
        },
        {
          id: 'recolor',
          icon: <Shuffle {...iconProps} />,
          label: 'Recolor patches by shade',
          onClick: () => {
            // TODO: Implement recolor patch in Phase 3
            // For now, open fabric picker
            actions.openFabricPicker();
          },
        },
        {
          id: 'delete',
          icon: <Trash2 {...iconProps} />,
          label: 'Delete',
          onClick: actions.delete,
        },
      ];

    case 'border':
      return [
        {
          id: 'fabric',
          icon: <Palette {...iconProps} />,
          label: 'Apply fabric',
          onClick: actions.openFabricPicker,
        },
        {
          id: 'width-minus',
          icon: <Minus {...iconProps} />,
          label: 'Decrease width',
          onClick: () => {
            // TODO: Implement border width adjustment in Phase 3
          },
        },
        {
          id: 'width-plus',
          icon: <Plus {...iconProps} />,
          label: 'Increase width',
          onClick: () => {
            // TODO: Implement border width adjustment in Phase 3
          },
        },
        {
          id: 'insert',
          icon: <PlusSquare {...iconProps} />,
          label: 'Insert border',
          onClick: () => {
            // TODO: Implement border insertion in Phase 3
          },
        },
        {
          id: 'remove',
          icon: <Trash2 {...iconProps} />,
          label: 'Remove border',
          onClick: actions.delete,
        },
      ];

    case 'sashing':
      return [
        {
          id: 'fabric',
          icon: <Palette {...iconProps} />,
          label: 'Apply fabric',
          onClick: actions.openFabricPicker,
        },
        {
          id: 'width-minus',
          icon: <Minus {...iconProps} />,
          label: 'Decrease width',
          onClick: () => {
            // TODO: Implement sashing width adjustment in Phase 3
          },
        },
        {
          id: 'width-plus',
          icon: <Plus {...iconProps} />,
          label: 'Increase width',
          onClick: () => {
            // TODO: Implement sashing width adjustment in Phase 3
          },
        },
        {
          id: 'color',
          icon: <PaintBucket {...iconProps} />,
          label: 'Change color',
          onClick: actions.openFabricPicker,
        },
      ];

    case 'patch':
      return [
        {
          id: 'fabric',
          icon: <Palette {...iconProps} />,
          label: 'Apply fabric',
          onClick: actions.openFabricPicker,
        },
        {
          id: 'color',
          icon: <PaintBucket {...iconProps} />,
          label: 'Change color',
          onClick: actions.openFabricPicker,
        },
      ];

    case 'easydraw':
      return [
        {
          id: 'bend',
          icon: <Spline {...iconProps} />,
          label: 'Bend segment',
          onClick: actions.activateBendTool,
        },
        {
          id: 'rotate',
          icon: <RotateCw {...iconProps} />,
          label: 'Rotate 90°',
          onClick: actions.rotate,
        },
        {
          id: 'delete',
          icon: <Trash2 {...iconProps} />,
          label: 'Delete',
          onClick: actions.delete,
        },
      ];

    case 'bent':
      return [
        {
          id: 'edit-bend',
          icon: <Spline {...iconProps} />,
          label: 'Edit bend',
          onClick: actions.activateBendTool,
        },
        {
          id: 'make-straight',
          icon: <Minimize2 {...iconProps} />,
          label: 'Make straight',
          onClick: actions.makeStraight,
        },
        {
          id: 'rotate',
          icon: <RotateCw {...iconProps} />,
          label: 'Rotate 90°',
          onClick: actions.rotate,
        },
        {
          id: 'delete',
          icon: <Trash2 {...iconProps} />,
          label: 'Delete',
          onClick: actions.delete,
        },
      ];

    default:
      return [];
  }
}
