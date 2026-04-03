'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useProjectStore } from '@/stores/projectStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { getRecentFabrics, type RecentFabric } from '@/lib/recent-fabrics';
import { findMatchingBlocks } from '@/lib/block-matching';
import { loadImage } from '@/lib/image-processing';
import {
  calculateHorizontalDistribution,
  calculateVerticalDistribution,
  type ObjectBounds,
} from '@/lib/alignment-engine';
import {
  findSimilarObjects,
  getAvailableSimilarityModes,
  type SimilarityMode,
} from '@/lib/select-similar-engine';

interface ContextMenuPosition {
  x: number;
  y: number;
  hasTarget: boolean;
}

type SubMenuType = 'fabric' | 'block' | 'printlist' | 'selectSimilar' | null;

export function ContextMenu() {
  const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
  const unitSystem = useCanvasStore((s) => s.unitSystem);
  const [position, setPosition] = useState<ContextMenuPosition | null>(null);
  const [showQuantityInput, setShowQuantityInput] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [subMenu, setSubMenu] = useState<SubMenuType>(null);
  const [recentFabrics, setRecentFabrics] = useState<RecentFabric[]>([]);
  const [libraryFabrics, setLibraryFabrics] = useState<
    Array<{ id: string; name: string; imageUrl: string }>
  >([]);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setPosition(null);
    setShowQuantityInput(false);
    setQuantity(1);
    setSubMenu(null);
  }, []);

  useEffect(() => {
    if (!fabricCanvas) return;

    let isMounted = true;
    let fabric: typeof import('fabric') | null = null;
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
        setSubMenu(null);
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

      if (!isMounted) return;

      canvas.on('mouse:down', onMouseDown);
      registeredListeners.push(() => canvas.off('mouse:down', onMouseDown));

      if (canvas.wrapperEl) {
        canvas.wrapperEl.addEventListener('contextmenu', handleContextMenu);
        registeredListeners.push(() =>
          canvas.wrapperEl.removeEventListener('contextmenu', handleContextMenu)
        );
      }

      canvas.on('mouse:down:before', onMouseDownBefore);
      registeredListeners.push(() => canvas.off('mouse:down:before', onMouseDownBefore));
    })();

    return () => {
      isMounted = false;
      for (const remove of registeredListeners) remove();
    };
  }, [fabricCanvas, closeMenu]);

  useEffect(() => {
    if (!position) return;

    let isMounted = true;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (subMenu) {
          setSubMenu(null);
        } else {
          closeMenu();
        }
      }
    }

    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }

    if (!isMounted) return;

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousedown', onClickOutside, { capture: true });

    return () => {
      isMounted = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousedown', onClickOutside, { capture: true });
    };
  }, [position, subMenu, closeMenu]);

  useEffect(() => {
    if (subMenu === 'fabric' && position) {
      setRecentFabrics(getRecentFabrics());
      const fabrics = useFabricStore.getState().fabrics;
      const userFabrics = useFabricStore.getState().userFabrics;
      const allFabrics = [...userFabrics, ...fabrics].slice(0, 12);
      setLibraryFabrics(
        allFabrics.map((f) => ({
          id: f.id,
          name: f.name,
          imageUrl: f.imageUrl,
        }))
      );
    }
  }, [subMenu, position]);

  const pushUndo = useCallback((canvas: unknown) => {
    const c = canvas as { toJSON: () => unknown };
    const json = JSON.stringify(c.toJSON());
    useCanvasStore.getState().pushUndoState(json);
    useProjectStore.getState().setDirty(true);
  }, []);

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
          case 'duplicateBlock': {
            if (active.type !== 'group') return;
            const cloned = await active.clone();
            cloned.set({
              left:
                (active.left ?? 0) +
                ((active as InstanceType<typeof fabric.Group>).width ?? 0) *
                  ((active as InstanceType<typeof fabric.Group>).scaleX ?? 1) +
                20,
              top: active.top ?? 0,
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
          case 'flipBlockH': {
            if (active.type !== 'group') return;
            active.set({ flipX: !active.flipX });
            break;
          }
          case 'flipBlockV': {
            if (active.type !== 'group') return;
            active.set({ flipY: !active.flipY });
            break;
          }
          case 'rotateBlock90': {
            if (active.type !== 'group') return;
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
          case 'group': {
            const selection = canvas.getActiveObjects();
            if (selection.length > 1) {
              const group = new fabric.Group(selection, { canvas });
              canvas.remove(...selection);
              canvas.add(group);
              canvas.setActiveObject(group);
            }
            break;
          }
          case 'ungroup': {
            if (active.type === 'group') {
              const group = active as InstanceType<typeof fabric.Group>;
              const items = group.removeAll();
              canvas.remove(group);
              for (const item of items) {
                canvas.add(item);
              }
              canvas.discardActiveObject();
            }
            break;
          }
        }

        active.setCoords();
        canvas.renderAll();
        pushUndo(canvas);
        closeMenu();
      } finally {
        setIsExecuting(false);
      }
    },
    [fabricCanvas, isExecuting, pushUndo, closeMenu]
  );

  const handleAddToPrintlist = useCallback(async () => {
    if (!fabricCanvas) return;
    const canvas = fabricCanvas as InstanceType<typeof import('fabric').Canvas>;
    const active = canvas.getActiveObject();
    if (!active) return;

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

  const handleAlign = useCallback(
    async (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (!fabricCanvas) return;
      const canvas = fabricCanvas as InstanceType<typeof import('fabric').Canvas>;
      const active = canvas.getActiveObject();
      if (!active || active.type !== 'activeSelection') return;

      const selection = active as InstanceType<typeof import('fabric').ActiveSelection>;
      const objects = selection.getObjects();
      if (objects.length < 2) return;

      const bounds = selection.getBoundingRect();

      for (const obj of objects) {
        const objBounds = obj.getBoundingRect();
        switch (direction) {
          case 'left':
            obj.set({ left: (obj.left ?? 0) + (bounds.left - objBounds.left) });
            break;
          case 'center':
            obj.set({
              left:
                (obj.left ?? 0) +
                (bounds.left + bounds.width / 2 - (objBounds.left + objBounds.width / 2)),
            });
            break;
          case 'right':
            obj.set({
              left:
                (obj.left ?? 0) + (bounds.left + bounds.width - (objBounds.left + objBounds.width)),
            });
            break;
          case 'top':
            obj.set({ top: (obj.top ?? 0) + (bounds.top - objBounds.top) });
            break;
          case 'middle':
            obj.set({
              top:
                (obj.top ?? 0) +
                (bounds.top + bounds.height / 2 - (objBounds.top + objBounds.height / 2)),
            });
            break;
          case 'bottom':
            obj.set({
              top:
                (obj.top ?? 0) + (bounds.top + bounds.height - (objBounds.top + objBounds.height)),
            });
            break;
        }
        obj.setCoords();
      }

      canvas.renderAll();
      pushUndo(canvas);
      closeMenu();
    },
    [fabricCanvas, pushUndo, closeMenu]
  );

  const handleSelectAllSameBlocks = useCallback(async () => {
    if (!fabricCanvas) return;
    const fabric = await import('fabric');
    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
    const active = canvas.getActiveObject();
    if (!active || active.type !== 'group') return;

    const matching = findMatchingBlocks(canvas, active);
    if (matching.length === 0) return;

    const allBlocks = [active, ...matching];
    const selection = new fabric.ActiveSelection(
      allBlocks as InstanceType<typeof fabric.FabricObject>[],
      { canvas }
    );
    canvas.setActiveObject(selection);
    canvas.renderAll();
    closeMenu();
  }, [fabricCanvas, closeMenu]);

  const handleDistribute = useCallback(
    async (direction: 'horizontal' | 'vertical') => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObject();
      if (!active || active.type !== 'activeSelection') return;

      const selection = active as InstanceType<typeof fabric.ActiveSelection>;
      const objects = selection.getObjects();
      if (objects.length < 3) return;

      const bounds: ObjectBounds[] = objects.map((obj) => {
        const br = obj.getBoundingRect();
        return {
          id: (obj as unknown as { id?: string }).id ?? `obj-${Date.now()}`,
          left: obj.left ?? 0,
          top: obj.top ?? 0,
          width: br.width,
          height: br.height,
        };
      });

      const result =
        direction === 'horizontal'
          ? calculateHorizontalDistribution(bounds)
          : calculateVerticalDistribution(bounds);
      if (!result) return;

      for (const adj of result.adjustments) {
        const obj = objects.find((o) => (o as unknown as { id?: string }).id === adj.id);
        if (obj) {
          obj.set({
            left: (obj.left ?? 0) + adj.deltaLeft,
            top: (obj.top ?? 0) + adj.deltaTop,
          });
          obj.setCoords();
        }
      }

      canvas.renderAll();
      pushUndo(canvas);
      closeMenu();
    },
    [fabricCanvas, pushUndo, closeMenu]
  );

  const handleSelectSimilar = useCallback(
    async (mode: SimilarityMode) => {
      if (!fabricCanvas) return;
      const fabric = await import('fabric');
      const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
      const active = canvas.getActiveObject();
      if (!active) return;

      const allObjects = canvas.getObjects();
      const matching = findSimilarObjects(allObjects, active, mode);
      if (matching.length === 0) return;

      const allSelected = [active, ...matching];
      const selection = new fabric.ActiveSelection(
        allSelected as InstanceType<typeof fabric.FabricObject>[],
        { canvas }
      );
      canvas.setActiveObject(selection);
      canvas.renderAll();
      pushUndo(canvas);
      closeMenu();
    },
    [fabricCanvas, pushUndo, closeMenu]
  );

  if (!position) return null;

  const isMultiSelect = (fabricCanvas?.getActiveObjects()?.length || 0) > 1;
  const isGroup = fabricCanvas?.getActiveObject()?.type === 'group';
  const activeObject = fabricCanvas?.getActiveObject();
  const sameBlockCount =
    isGroup && activeObject ? findMatchingBlocks(fabricCanvas, activeObject).length : 0;

  if (subMenu === 'fabric') {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[220px] rounded-lg border border-outline-variant bg-surface py-1 shadow-elevation-4"
        style={{ left: position.x, top: position.y }}
      >
        <button
          type="button"
          onClick={() => setSubMenu(null)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background"
        >
          <span className="w-5 text-center">←</span>
          Back
        </button>
        <div className="my-1 border-t border-outline-variant" />

        {recentFabrics.length > 0 && (
          <>
            <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-secondary/60">
              Recent
            </div>
            {recentFabrics.map((rf) => (
              <button
                key={rf.id}
                type="button"
                disabled={isExecuting}
                onClick={async () => {
                  if (!fabricCanvas || !activeObject) return;
                  setIsExecuting(true);
                  try {
                    const fabric = await import('fabric');
                    const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
                    const img = await loadImage(rf.imageUrl);
                    const pattern = new fabric.Pattern({ source: img, repeat: 'repeat' });

                    if (activeObject.type === 'group') {
                      const g = activeObject as InstanceType<typeof fabric.Group>;
                      for (const obj of g.getObjects()) {
                        obj.set('fill', pattern);
                      }
                    } else {
                      activeObject.set('fill', pattern);
                    }

                    canvas.renderAll();
                    pushUndo(canvas);
                    closeMenu();
                  } finally {
                    setIsExecuting(false);
                  }
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50"
              >
                <div
                  className="h-5 w-5 rounded-sm border border-outline-variant bg-cover bg-center"
                  style={{ backgroundImage: `url(${rf.imageUrl})` }}
                />
                <span className="truncate">{rf.name}</span>
              </button>
            ))}
            <div className="my-1 border-t border-outline-variant" />
          </>
        )}

        <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-secondary/60">
          Library
        </div>
        {libraryFabrics.length === 0 && (
          <div className="px-3 py-3 text-xs text-secondary/60">
            No fabrics available. Drag from the Fabric Library to add.
          </div>
        )}
        {libraryFabrics.map((lf) => (
          <button
            key={lf.id}
            type="button"
            disabled={isExecuting}
            onClick={async () => {
              if (!fabricCanvas || !activeObject) return;
              setIsExecuting(true);
              try {
                const fabric = await import('fabric');
                const canvas = fabricCanvas as InstanceType<typeof fabric.Canvas>;
                const img = await loadImage(lf.imageUrl);
                const pattern = new fabric.Pattern({ source: img, repeat: 'repeat' });

                if (activeObject.type === 'group') {
                  const g = activeObject as InstanceType<typeof fabric.Group>;
                  for (const obj of g.getObjects()) {
                    obj.set('fill', pattern);
                  }
                } else {
                  activeObject.set('fill', pattern);
                }

                canvas.renderAll();
                pushUndo(canvas);
                closeMenu();
              } finally {
                setIsExecuting(false);
              }
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50"
          >
            <div
              className="h-5 w-5 rounded-sm border border-outline-variant bg-cover bg-center"
              style={{ backgroundImage: `url(${lf.imageUrl})` }}
            />
            <span className="truncate">{lf.name}</span>
          </button>
        ))}
      </div>
    );
  }

  if (subMenu === 'block' && isGroup) {
    return (
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[220px] rounded-lg border border-outline-variant bg-surface py-1 shadow-elevation-4"
        style={{ left: position.x, top: position.y }}
      >
        <button
          type="button"
          onClick={() => setSubMenu(null)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background"
        >
          <span className="w-5 text-center">←</span>
          Back
        </button>
        <div className="my-1 border-t border-outline-variant" />

        <button
          type="button"
          disabled={isExecuting}
          onClick={() => executeAction('duplicateBlock')}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="w-5 text-center">⧉</span>
          Duplicate Block
        </button>
        <button
          type="button"
          disabled={isExecuting}
          onClick={() => executeAction('flipBlockH')}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="w-5 text-center">↔</span>
          Flip Block Horizontal
        </button>
        <button
          type="button"
          disabled={isExecuting}
          onClick={() => executeAction('flipBlockV')}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="w-5 text-center">↕</span>
          Flip Block Vertical
        </button>
        <button
          type="button"
          disabled={isExecuting}
          onClick={() => executeAction('rotateBlock90')}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="w-5 text-center">↻</span>
          Rotate Block 90°
        </button>
        {sameBlockCount > 0 && (
          <>
            <div className="my-1 border-t border-outline-variant" />
            <button
              type="button"
              disabled={isExecuting}
              onClick={handleSelectAllSameBlocks}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="w-5 text-center">⊞</span>
              Select All {sameBlockCount + 1} Matching Blocks
            </button>
          </>
        )}
      </div>
    );
  }

  if (subMenu === 'selectSimilar') {
    const modes = activeObject ? getAvailableSimilarityModes(activeObject) : [];
    const modeLabels: Record<SimilarityMode, string> = {
      fabric: 'Same Fabric',
      fillColor: 'Same Fill Color',
      strokeColor: 'Same Stroke Color',
      blockStructure: 'Same Block Structure',
    };
    const modeIcons: Record<SimilarityMode, string> = {
      fabric: '◆',
      fillColor: '◼',
      strokeColor: '◻',
      blockStructure: '⊞',
    };

    return (
      <div
        ref={menuRef}
        className="fixed z-50 min-w-[220px] rounded-lg border border-outline-variant bg-surface py-1 shadow-elevation-4"
        style={{ left: position.x, top: position.y }}
      >
        <button
          type="button"
          onClick={() => setSubMenu(null)}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background"
        >
          <span className="w-5 text-center">←</span>
          Back
        </button>
        <div className="my-1 border-t border-outline-variant" />
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            disabled={isExecuting}
            onClick={() => handleSelectSimilar(mode)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background disabled:opacity-50"
          >
            <span className="w-5 text-center">{modeIcons[mode]}</span>
            {modeLabels[mode]}
          </button>
        ))}
        {modes.length === 0 && (
          <div className="px-3 py-3 text-xs text-secondary/60">No similarity criteria found</div>
        )}
      </div>
    );
  }

  const menuItems = position.hasTarget
    ? [
        { label: 'Duplicate', icon: '⧉', action: 'duplicate' },
        { label: 'Delete', icon: '🗑', action: 'delete' },
        { label: 'divider', icon: '', action: 'divider' },
        { label: 'Flip Horizontal', icon: '↔', action: 'flipH' },
        { label: 'Flip Vertical', icon: '↕', action: 'flipV' },
        { label: 'Rotate 90°', icon: '↻', action: 'rotate90' },
        { label: 'divider', icon: '', action: 'divider' },
        ...(isMultiSelect
          ? [
              { label: 'Group', icon: '⊡', action: 'group' },
              { label: 'Align Left', icon: '⊣', action: 'align-left' },
              { label: 'Align Center', icon: '⊟', action: 'align-center' },
              { label: 'Align Right', icon: '⊢', action: 'align-right' },
              { label: 'Align Top', icon: '⊤', action: 'align-top' },
              { label: 'Align Middle', icon: '⊞', action: 'align-middle' },
              { label: 'Align Bottom', icon: '⊥', action: 'align-bottom' },
              { label: 'divider', icon: '', action: 'divider' },
              { label: 'Distribute Horizontally', icon: '⇔', action: 'distribute-h' },
              { label: 'Distribute Vertically', icon: '⇕', action: 'distribute-v' },
              { label: 'divider', icon: '', action: 'divider' },
            ]
          : []),
        ...(isGroup
          ? [
              { label: 'Block Settings ▸', icon: '⚙', action: 'block-menu' },
              { label: 'Ungroup', icon: '⊟', action: 'ungroup' },
            ]
          : []),
        { label: 'Send to Back', icon: '⤓', action: 'sendToBack' },
        { label: 'Bring to Front', icon: '⤒', action: 'bringToFront' },
        { label: 'divider', icon: '', action: 'divider' },
        { label: 'Select Similar ▸', icon: '◎', action: 'select-similar' },
        { label: 'divider', icon: '', action: 'divider' },
        { label: 'Add Fabric ▸', icon: '◆', action: 'fabric-menu' },
        ...(isGroup && sameBlockCount > 0
          ? [
              {
                label: `Apply Fabric to All ${sameBlockCount + 1} Blocks ▸`,
                icon: '◆◆',
                action: 'fabric-all',
              },
            ]
          : []),
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
        ) : item.action === 'fabric-menu' ? (
          <button
            key={item.action}
            type="button"
            onClick={() => setSubMenu('fabric')}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background"
          >
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </button>
        ) : item.action === 'fabric-all' ? (
          <div key={item.action}>
            {!subMenu ? (
              <button
                type="button"
                onClick={() => setSubMenu('fabric')}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background"
              >
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </button>
            ) : null}
          </div>
        ) : item.action === 'block-menu' ? (
          <button
            key={item.action}
            type="button"
            onClick={() => setSubMenu('block')}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-secondary hover:bg-background"
          >
            <span className="w-5 text-center">{item.icon}</span>
            {item.label}
          </button>
        ) : (
          <button
            key={item.action}
            type="button"
            disabled={isExecuting}
            onClick={() => {
              if (item.action === 'selectAll') {
                handleSelectAll();
              } else if (item.action === 'distribute-h') {
                handleDistribute('horizontal');
              } else if (item.action === 'distribute-v') {
                handleDistribute('vertical');
              } else if (item.action === 'select-similar') {
                setSubMenu('selectSimilar');
              } else if (item.action.startsWith('align-')) {
                const direction = item.action.replace('align-', '') as
                  | 'left'
                  | 'center'
                  | 'right'
                  | 'top'
                  | 'middle'
                  | 'bottom';
                handleAlign(direction);
              } else {
                executeAction(item.action);
              }
            }}
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
