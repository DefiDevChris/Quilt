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
  const [isExecuting, setIsExecuting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setPosition(null);
    setShowQuantityInput(false);
    setQuantity(1);
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    let isMounted = true;
    let fabric: typeof import('fabric') | null = null;
    // Track registered listeners independently of isMounted so cleanup
    // always runs even when unmount races with the async import.
    const registeredListeners: Array<() => void> = [];

    (async () => {
      fabric = await import('fabric');
      if (!isMounted) return;
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

      function onMouseDown() {
        closeMenu();
      }

      const handleContextMenu = (evt: MouseEvent) => {
        evt.preventDefault();
      };

      const onMouseDownBefore = ((e: { e: MouseEvent }) => {
        if (e.e.button === 2) {
          const target = canvas.findTarget(e.e) as unknown;
          if (target && fabric) {
            canvas.setActiveObject(target as InstanceType<typeof fabric.FabricObject>);
          }
          onContextMenu({ e: e.e, target });
        }
      }) as never;

      // Guard: only register listeners if component is still mounted, then
      // immediately record each removal so the cleanup closure (below) can
      // always tear them down regardless of future isMounted state.
      if (!isMounted) return;

      canvas.on('mouse:down', onMouseDown);
      registeredListeners.push(() => canvas.off('mouse:down', onMouseDown));

      canvas.wrapperEl.addEventListener('contextmenu', handleContextMenu);
      registeredListeners.push(() =>
        canvas.wrapperEl.removeEventListener('contextmenu', handleContextMenu)
      );

      canvas.on('mouse:down:before', onMouseDownBefore);
      registeredListeners.push(() => canvas.off('mouse:down:before', onMouseDownBefore));
    })();

    return () => {
      isMounted = false;
      for (const remove of registeredListeners) remove();
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
      if (!fabricCanvas || isExecuting) return;
      setIsExecuting(true);
      try {
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
          case 'fussyCut': {
            // Extract fabric pattern info from the active object
            const fill = active.get('fill');
            if (fill && typeof fill !== 'string') {
              const patternFill = fill as {
                source?: { src?: string };
                patternSourceCanvas?: unknown;
              };
              const fabricImageUrl = patternFill.source?.src ?? '';
              const fabricId = (active as unknown as { fabricId?: string }).fabricId ?? '';
              const vertices: { x: number; y: number }[] = [];

              // Get patch shape vertices if it's a polygon
              if (
                'points' in active &&
                Array.isArray((active as unknown as { points: unknown[] }).points)
              ) {
                const pts = (active as unknown as { points: { x: number; y: number }[] }).points;
                for (const pt of pts) {
                  vertices.push({ x: pt.x, y: pt.y });
                }
              } else {
                // Fallback: use bounding box corners
                const bounds = active.getBoundingRect();
                vertices.push(
                  { x: bounds.left, y: bounds.top },
                  { x: bounds.left + bounds.width, y: bounds.top },
                  { x: bounds.left + bounds.width, y: bounds.top + bounds.height },
                  { x: bounds.left, y: bounds.top + bounds.height }
                );
              }

              useCanvasStore.getState().setFussyCutTarget({
                objectId: (active as unknown as { id?: string }).id ?? `obj-${Date.now()}`,
                fabricId,
                fabricImageUrl,
                patchVertices: vertices,
              });
            }
            break;
          }
        }

        active.setCoords();
        canvas.renderAll();
        const json = JSON.stringify(canvas.toJSON());
        useCanvasStore.getState().pushUndoState(json);
        useProjectStore.getState().setDirty(true);
        closeMenu();
      } finally {
        setIsExecuting(false);
      }
    },
    [fabricCanvas, isExecuting, closeMenu]
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
        { label: 'Fussy Cut...', icon: '✂', action: 'fussyCut' },
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
                disabled={isExecuting}
                onClick={() => setShowQuantityInput(true)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={isExecuting}
                  onClick={handleAddToPrintlist}
                  className="rounded bg-primary px-2 py-0.5 text-xs text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExecuting ? '...' : 'Add'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            key={item.action}
            type="button"
            disabled={isExecuting}
            onClick={() =>
              item.action === 'selectAll' ? handleSelectAll() : executeAction(item.action)
            }
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </button>
        )
      )}
    </div>
  );
}
