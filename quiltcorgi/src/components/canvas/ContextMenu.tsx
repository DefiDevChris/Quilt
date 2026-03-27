'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';
import { usePrintlistStore } from '@/stores/printlistStore';

interface ContextMenuPosition {
  x: number;
  y: number;
  hasTarget: boolean;
}

export function ContextMenu() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setPosition(null);
    setShowQuantityInput(false);
    setQuantity(1);
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    let fabric: typeof import('fabric') | null = null;
    let cleanupFn: (() => void) | null = null;

    (async () => {
      fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;

      function onContextMenu(e: { e: MouseEvent; target?: unknown }) {
        e.e.preventDefault();
        e.e.stopPropagation();
        setPosition({
          x: e.e.clientX,
          y: e.e.clientY,
          hasTarget: !!e.target,
        });
      }

      canvas.on('mouse:down', () => {
        closeMenu();
      });

      canvas.wrapperEl.addEventListener('contextmenu', (evt) => {
        evt.preventDefault();
      });

      canvas.on('mouse:down:before', ((e: { e: MouseEvent }) => {
        if (e.e.button === 2) {
          const target = canvas.findTarget(e.e) as unknown;
          if (target && fabric) {
            canvas.setActiveObject(target as InstanceType<typeof fabric.FabricObject>);
          }
          onContextMenu({ e: e.e, target });
        }
      }) as never);

      cleanupFn = () => {
        // Listeners cleaned up by canvas disposal
      };
    })();

    return () => {
      cleanupFn?.();
    };
  }, [fabricCanvas, closeMenu]);

  // Close on Escape or outside click
  useEffect(() => {
    if (!position) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenu();
    }

    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onClickOutside, { capture: true });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onClickOutside, { capture: true });
    };
  }, [position, closeMenu]);

  const executeAction = useCallback(
    async (action: string) => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObject();
      if (!active) return;

      switch (action) {
        case 'duplicate': {
          const cloned = await active.clone();
          cloned.set({
            left: (active.left ?? 0) + 20,
            top: (active.top ?? 0) + 20,
          });
          canvas.add(cloned);
          canvas.setActiveObject(cloned);
          break;
        }
        case 'delete': {
          canvas.remove(active);
          canvas.discardActiveObject();
          break;
        }
        case 'flipH': {
          active.set({ flipX: !active.flipX });
          break;
        }
        case 'flipV': {
          active.set({ flipY: !active.flipY });
          break;
        }
        case 'rotate90': {
          active.rotate((active.angle ?? 0) + 90);
          break;
        }
        case 'sendToBack': {
          canvas.sendObjectToBack(active);
          break;
        }
        case 'bringToFront': {
          canvas.bringObjectToFront(active);
          break;
        }
      }

      active.setCoords();
      canvas.renderAll();
      const json = JSON.stringify(canvas.toJSON());
      useCanvasStore.getState().pushUndoState(json);
      useProjectStore.getState().setDirty(true);
      closeMenu();
    },
    [fabricCanvas, closeMenu]
  );

  const handleAddToPrintlist = useCallback(async () => {
    if (!fabricCanvas) return;
    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const active = canvas.getActiveObject();
    if (!active) return;

    const bounds = active.getBoundingRect();
    const shapeName =
      (active as unknown as { name?: string }).name ??
      `${active.type ?? 'Shape'} ${Date.now().toString(36)}`;

    usePrintlistStore.getState().addItem({
      shapeId: (active as unknown as { id?: string }).id ?? `shape-${Date.now()}`,
      shapeName,
      svgData: active.toSVG(),
      quantity,
      unitSystem,
    });

    void bounds;
    closeMenu();
  }, [fabricCanvas, quantity, unitSystem, closeMenu]);

  const handleSelectAll = useCallback(async () => {
    if (!fabricCanvas) return;
    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const objs = canvas.getObjects();
    if (objs.length === 0) return;
    const selection = new fabric.ActiveSelection(objs, { canvas });
    canvas.setActiveObject(selection);
    canvas.renderAll();
    closeMenu();
  }, [fabricCanvas, closeMenu]);

  if (!position) return null;

  const menuItems = position.hasTarget
    ? [
        { label: 'Duplicate', icon: '⧉', action: 'duplicate' },
        { label: 'Delete', icon: '🗑', action: 'delete' },
        { label: 'Flip Horizontal', icon: '↔', action: 'flipH' },
        { label: 'Flip Vertical', icon: '↕', action: 'flipV' },
        { label: 'Rotate 90°', icon: '↻', action: 'rotate90' },
        { label: 'Send to Back', icon: '⤓', action: 'sendToBack' },
        { label: 'Bring to Front', icon: '⤒', action: 'bringToFront' },
        { label: 'divider', icon: '', action: 'divider' },
        { label: 'Add to Printlist', icon: '🖨', action: 'printlist' },
      ]
    : [{ label: 'Select All', icon: '⊞', action: 'selectAll' }];

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[180px] rounded-lg border border-outline-variant bg-surface py-1 shadow-elevation-4"
      style={{ left: position.x, top: position.y }}
    >
      {menuItems.map((item, i) =>
        item.action === 'divider' ? (
          <div key={i} className="my-1 border-t border-outline-variant" />
        ) : item.action === 'printlist' ? (
          <div key={item.action}>
            {!showQuantityInput ? (
              <button
                type="button"
                onClick={() => setShowQuantityInput(true)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background"
              >
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </button>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1.5">
                <span className="w-5 text-center text-sm">🖨</span>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-14 rounded border border-outline-variant bg-white px-1.5 py-0.5 text-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddToPrintlist();
                    if (e.key === 'Escape') setShowQuantityInput(false);
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddToPrintlist}
                  className="rounded bg-primary px-2 py-0.5 text-xs text-white hover:opacity-90"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            key={item.action}
            type="button"
            onClick={() =>
              item.action === 'selectAll' ? handleSelectAll() : executeAction(item.action)
            }
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background"
          >
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
