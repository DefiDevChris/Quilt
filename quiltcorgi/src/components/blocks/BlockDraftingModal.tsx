'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';

interface BlockDraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const DRAFT_CANVAS_SIZE = 400;
const BLOCK_SIZE_UNITS = 12; // 12 inches default

export function BlockDraftingModal({ isOpen, onClose, onSaved }: BlockDraftingModalProps) {
  const [blockName, setBlockName] = useState('');
  const [category, setCategory] = useState('Custom');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeDraftTool, setActiveDraftTool] = useState<
    'select' | 'rectangle' | 'triangle' | 'polygon' | 'line' | 'curve'
  >('select');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<unknown>(null);
  const parentFillColor = useCanvasStore((s) => s.fillColor);
  const parentStrokeColor = useCanvasStore((s) => s.strokeColor);

  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    let disposed = false;

    (async () => {
      const fabric = await import('fabric');
      if (disposed || !canvasRef.current) return;

      const canvas = new fabric.Canvas(canvasRef.current, {
        width: DRAFT_CANVAS_SIZE,
        height: DRAFT_CANVAS_SIZE,
        backgroundColor: '#FFFFFF',
        selection: true,
        preserveObjectStacking: true,
      });

      // Draw grid on the drafting canvas
      const gridStep = DRAFT_CANVAS_SIZE / BLOCK_SIZE_UNITS;
      for (let i = 0; i <= BLOCK_SIZE_UNITS; i++) {
        const pos = i * gridStep;
        canvas.add(
          new fabric.Line([pos, 0, pos, DRAFT_CANVAS_SIZE], {
            stroke: '#E5E2DD',
            strokeWidth: i === 0 || i === BLOCK_SIZE_UNITS ? 2 : 0.5,
            selectable: false,
            evented: false,
          })
        );
        canvas.add(
          new fabric.Line([0, pos, DRAFT_CANVAS_SIZE, pos], {
            stroke: '#E5E2DD',
            strokeWidth: i === 0 || i === BLOCK_SIZE_UNITS ? 2 : 0.5,
            selectable: false,
            evented: false,
          })
        );
      }
      canvas.renderAll();
      draftCanvasRef.current = canvas;
    })();

    return () => {
      disposed = true;
      if (
        draftCanvasRef.current &&
        typeof (draftCanvasRef.current as { dispose?: () => void }).dispose === 'function'
      ) {
        (draftCanvasRef.current as { dispose: () => void }).dispose();
      }
      draftCanvasRef.current = null;
    };
  }, [isOpen]);

  // Handle drafting tool interactions
  useEffect(() => {
    if (!draftCanvasRef.current || !isOpen) return;

    let fabric: typeof import('fabric') | null = null;
    let cleanup: (() => void) | null = null;

    (async () => {
      fabric = await import('fabric');
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      if (activeDraftTool === 'select') {
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        canvas.getObjects().forEach((obj) => {
          if (!obj.strokeDashArray || obj.stroke !== '#E5E2DD') {
            obj.selectable = true;
            obj.evented = true;
          }
        });
        canvas.renderAll();
        return;
      }

      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
      canvas.discardActiveObject();

      let isDrawing = false;
      let startX = 0;
      let startY = 0;
      let previewShape: InstanceType<typeof fabric.FabricObject> | null = null;

      function onMouseDown(e: { e: MouseEvent }) {
        if (!fabric || !canvas) return;
        const pointer = canvas.getScenePoint(e.e);
        isDrawing = true;
        startX = pointer.x;
        startY = pointer.y;

        if (activeDraftTool === 'rectangle') {
          previewShape = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: parentStrokeColor,
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });
        } else if (activeDraftTool === 'triangle') {
          previewShape = new fabric.Polygon(
            [
              { x: startX, y: startY },
              { x: startX, y: startY },
              { x: startX, y: startY },
            ],
            {
              fill: 'transparent',
              stroke: parentStrokeColor,
              strokeWidth: 1,
              strokeDashArray: [5, 5],
              selectable: false,
              evented: false,
            }
          );
        } else if (activeDraftTool === 'line') {
          previewShape = new fabric.Line([startX, startY, startX, startY], {
            stroke: parentStrokeColor,
            strokeWidth: 1,
            strokeDashArray: [5, 5],
            selectable: false,
            evented: false,
          });
        }

        if (previewShape) canvas.add(previewShape);
        canvas.renderAll();
      }

      function onMouseMove(e: { e: MouseEvent }) {
        if (!fabric || !isDrawing || !previewShape) return;
        const pointer = canvas.getScenePoint(e.e);
        if (activeDraftTool === 'rectangle') {
          previewShape.set({
            left: Math.min(startX, pointer.x),
            top: Math.min(startY, pointer.y),
            width: Math.abs(pointer.x - startX),
            height: Math.abs(pointer.y - startY),
          });
        } else if (activeDraftTool === 'triangle') {
          const poly = previewShape as InstanceType<typeof fabric.Polygon>;
          poly.points = [
            { x: startX, y: pointer.y },
            { x: pointer.x, y: pointer.y },
            { x: startX, y: startY },
          ];
          poly.setBoundingBox(true);
          poly.setCoords();
        } else if (activeDraftTool === 'line') {
          (previewShape as InstanceType<typeof fabric.Line>).set({ x2: pointer.x, y2: pointer.y });
        }
        canvas.renderAll();
      }

      function onMouseUp() {
        if (!fabric || !isDrawing || !previewShape) return;
        isDrawing = false;
        const w = previewShape.width ?? 0;
        const h = previewShape.height ?? 0;
        if (w < 2 && h < 2) {
          canvas.remove(previewShape);
        } else {
          previewShape.set({
            fill: activeDraftTool === 'line' ? undefined : parentFillColor,
            stroke: parentStrokeColor,
            strokeWidth: 1,
            strokeDashArray: undefined,
            selectable: true,
            evented: true,
          });
        }
        previewShape = null;
        canvas.renderAll();
      }

      canvas.on('mouse:down', onMouseDown as never);
      canvas.on('mouse:move', onMouseMove as never);
      canvas.on('mouse:up', onMouseUp as never);

      cleanup = () => {
        canvas.off('mouse:down', onMouseDown as never);
        canvas.off('mouse:move', onMouseMove as never);
        canvas.off('mouse:up', onMouseUp as never);
      };
    })();

    return () => {
      cleanup?.();
    };
  }, [isOpen, activeDraftTool, parentFillColor, parentStrokeColor]);

  const generateThumbnailSvg = useCallback(async (): Promise<string> => {
    if (!draftCanvasRef.current) return '';
    const fabric = await import('fabric');
    const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;
    // Get only user-drawn objects (skip grid lines)
    const objs = canvas.getObjects().filter((o) => o.stroke !== '#E5E2DD');
    if (objs.length === 0) return '';

    const parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'];
    for (const obj of objs) {
      parts.push(obj.toSVG());
    }
    parts.push('</svg>');
    return parts.join('');
  }, []);

  const handleSave = useCallback(async () => {
    if (!blockName.trim()) {
      setError('Block name is required');
      return;
    }
    if (!draftCanvasRef.current) return;

    setSaving(true);
    setError('');

    try {
      const fabric = await import('fabric');
      const canvas = draftCanvasRef.current as InstanceType<typeof fabric.Canvas>;

      // Get user-drawn objects (skip grid lines)
      const objs = canvas.getObjects().filter((o) => o.stroke !== '#E5E2DD');
      if (objs.length === 0) {
        setError('Draw at least one shape before saving');
        setSaving(false);
        return;
      }

      // Build Fabric.js JSON for the block
      const clones = await Promise.all(objs.map((o) => o.clone()));
      const group = new fabric.Group(clones);
      const fabricJsData = group.toObject() as unknown as Record<string, unknown>;
      fabricJsData.width = 100;
      fabricJsData.height = 100;

      const svgData = await generateThumbnailSvg();

      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: blockName.trim(),
          category: category.trim() || 'Custom',
          svgData,
          fabricJsData,
          tags: tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to save block');
        setSaving(false);
        return;
      }

      onSaved();
      onClose();
    } catch {
      setError('Failed to save block');
    } finally {
      setSaving(false);
    }
  }, [blockName, category, tags, onSaved, onClose, generateThumbnailSvg]);

  if (!isOpen) return null;

  const draftTools: { id: typeof activeDraftTool; label: string; icon: string }[] = [
    { id: 'select', label: 'Select', icon: '↖' },
    { id: 'rectangle', label: 'Rectangle', icon: '▭' },
    { id: 'triangle', label: 'Triangle', icon: '△' },
    { id: 'line', label: 'Line', icon: '╱' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[560px] rounded-xl bg-surface p-5 shadow-elevation-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-on-surface">Draft Custom Block</h2>
          <button type="button" onClick={onClose} className="text-secondary hover:text-on-surface">
            ✕
          </button>
        </div>

        {/* Drafting toolbar */}
        <div className="mb-2 flex items-center gap-1">
          {draftTools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveDraftTool(tool.id)}
              title={tool.label}
              className={`h-8 w-8 rounded text-sm ${
                activeDraftTool === tool.id
                  ? 'bg-primary text-white'
                  : 'text-secondary hover:bg-background'
              }`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Drafting canvas */}
        <div className="mb-4 flex justify-center rounded border border-outline-variant bg-white">
          <canvas ref={canvasRef} width={DRAFT_CANVAS_SIZE} height={DRAFT_CANVAS_SIZE} />
        </div>

        {/* Block metadata */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-secondary">Block Name *</label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              placeholder="My Custom Block"
              maxLength={255}
              className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-secondary">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Custom"
              maxLength={100}
              className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-xs font-medium text-secondary">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="modern, geometric, stars"
              className="w-full rounded-sm border border-outline-variant bg-white px-2.5 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mb-3 text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm text-secondary hover:bg-background"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Block'}
          </button>
        </div>
      </div>
    </div>
  );
}
