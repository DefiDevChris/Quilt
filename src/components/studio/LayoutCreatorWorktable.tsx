'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { GRID_LINE_COLOR } from '@/lib/constants';
import { useToast } from '@/components/ui/ToastProvider';

interface LayoutCreatorWorktableProps {
  onDone: () => void;
}

type CreatorTool = 'select' | 'rectangle' | 'triangle';
type LayoutRole = 'block-cell' | 'sashing' | 'border' | 'binding' | 'edging' | 'none';

const ROLE_COLORS: Record<LayoutRole, { fill: string; stroke: string }> = {
  'block-cell': { fill: 'rgba(76, 175, 80, 0.06)', stroke: '#4CAF50' },
  sashing: { fill: 'rgba(176, 160, 144, 0.12)', stroke: '#B0A090' },
  border: { fill: 'rgba(156, 106, 58, 0.1)', stroke: '#9C6A3A' },
  binding: { fill: 'rgba(80, 80, 80, 0.08)', stroke: '#505050' },
  edging: { fill: 'rgba(107, 123, 141, 0.08)', stroke: '#6B7B8D' },
  none: { fill: 'rgba(100, 100, 100, 0.06)', stroke: '#999' },
};

const ROLE_LABELS: Record<LayoutRole, string> = {
  'block-cell': 'Block Cell',
  sashing: 'Sashing Strip',
  border: 'Border',
  binding: 'Binding',
  edging: 'Edging',
  none: 'No Role',
};

const CANVAS_SIZE = 600;

export function LayoutCreatorWorktable({ onDone }: LayoutCreatorWorktableProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<unknown>(null);
  const [activeTool, setActiveTool] = useState<CreatorTool>('select');
  const [selectedObject, setSelectedObject] = useState<unknown | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [saving, setSaving] = useState(false);
  const isDrawingRef = useRef(false);
  const drawStartPointRef = useRef<{ x: number; y: number } | null>(null);
  const tempShapeRef = useRef<unknown | null>(null);
  const { toast } = useToast();

  // Initialize Fabric canvas
  useEffect(() => {
    const canvasEl = canvasElRef.current;
    if (!canvasEl) return;
    let cancelled = false;

    async function init() {
      const fabric = await import('fabric');
      if (cancelled || !canvasEl) return;

      const fc = new fabric.Canvas(canvasEl, {
        width: CANVAS_SIZE,
        height: CANVAS_SIZE,
        backgroundColor: '#F8F7F5',
        selection: true,
        preserveObjectStacking: true,
      });
      fabricCanvasRef.current = fc;
      useCanvasStore.getState().setFabricCanvas(
        fc as unknown as InstanceType<typeof fabric.Canvas>
      );

      // Draw reference grid
      const gridSize = 20;
      const gridLines: unknown[] = [];
      for (let x = 0; x <= CANVAS_SIZE; x += gridSize) {
        const line = new fabric.Line([x, 0, x, CANVAS_SIZE], {
          stroke: GRID_LINE_COLOR,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as Record<string, unknown>)['_layoutGridElement'] = true;
        gridLines.push(line);
      }
      for (let y = 0; y <= CANVAS_SIZE; y += gridSize) {
        const line = new fabric.Line([0, y, CANVAS_SIZE, y], {
          stroke: GRID_LINE_COLOR,
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (line as unknown as Record<string, unknown>)['_layoutGridElement'] = true;
        gridLines.push(line);
      }
      gridLines.forEach((l) => fc.add(l as Parameters<typeof fc.add>[0]));

      // Events
      fc.on('selection:created', (e) => {
        const obj = e.selected?.[0] ?? null;
        if (obj && !(obj as unknown as Record<string, unknown>)['_layoutGridElement']) {
          setSelectedObject(obj);
        }
      });
      fc.on('selection:updated', (e) => {
        const obj = e.selected?.[0] ?? null;
        if (obj && !(obj as unknown as Record<string, unknown>)['_layoutGridElement']) {
          setSelectedObject(obj);
        }
      });
      fc.on('selection:cleared', () => setSelectedObject(null));

      fc.on('mouse:down', (opt) => {
        if (activeTool === 'select') return;
        const pointer = (fc as unknown as { getPointer: (e: import('fabric').TPointerEvent) => { x: number; y: number } }).getPointer(opt.e!);
        isDrawingRef.current = true;
        drawStartPointRef.current = { x: pointer.x, y: pointer.y };
      });

      fc.on('mouse:move', (opt) => {
        if (!isDrawingRef.current || !drawStartPointRef.current) return;
        const pointer = (fc as unknown as { getPointer: (e: import('fabric').TPointerEvent) => { x: number; y: number } }).getPointer(opt.e!);
        const start = drawStartPointRef.current;

        if (tempShapeRef.current) {
          fc.remove(tempShapeRef.current as Parameters<typeof fc.remove>[0]);
        }

        const colors = ROLE_COLORS['none'];
        if (activeTool === 'rectangle') {
          const rect = new fabric.Rect({
            left: Math.min(start.x, pointer.x),
            top: Math.min(start.y, pointer.y),
            width: Math.abs(pointer.x - start.x),
            height: Math.abs(pointer.y - start.y),
            fill: colors.fill,
            stroke: colors.stroke,
            strokeWidth: 1.5,
            strokeDashArray: [5, 3],
            selectable: false,
            evented: false,
          });
          tempShapeRef.current = rect;
          fc.add(rect);
          fc.renderAll();
        } else if (activeTool === 'triangle') {
          const tri = new fabric.Triangle({
            left: Math.min(start.x, pointer.x),
            top: Math.min(start.y, pointer.y),
            width: Math.abs(pointer.x - start.x),
            height: Math.abs(pointer.y - start.y),
            fill: colors.fill,
            stroke: colors.stroke,
            strokeWidth: 1.5,
            strokeDashArray: [5, 3],
            selectable: false,
            evented: false,
          });
          tempShapeRef.current = tri;
          fc.add(tri);
          fc.renderAll();
        }
      });

      fc.on('mouse:up', () => {
        if (!isDrawingRef.current || !drawStartPointRef.current) return;
        isDrawingRef.current = false;
        const pointer = (fc as unknown as { getPointer: (e: import('fabric').TPointerEvent) => { x: number; y: number } }).getPointer(
          {} as import('fabric').TPointerEvent
        );
        const start = drawStartPointRef.current!;
        drawStartPointRef.current = null;

        if (tempShapeRef.current) {
          fc.remove(tempShapeRef.current as Parameters<typeof fc.remove>[0]);
          tempShapeRef.current = null;
        }

        const w = pointer.x - start.x;
        const h = pointer.y - start.y;
        if (Math.abs(w) < 5 || Math.abs(h) < 5) return;

        const colors = ROLE_COLORS['none'];
        if (activeTool === 'rectangle') {
          const rect = new fabric.Rect({
            left: Math.min(start.x, pointer.x),
            top: Math.min(start.y, pointer.y),
            width: Math.abs(w),
            height: Math.abs(h),
            fill: colors.fill,
            stroke: colors.stroke,
            strokeWidth: 1.5,
            selectable: true,
            evented: true,
          });
          (rect as unknown as Record<string, unknown>)['_layoutShape'] = true;
          (rect as unknown as Record<string, unknown>)['_layoutRole'] = 'none';
          fc.add(rect);
          fc.setActiveObject(rect);
          fc.renderAll();
        } else if (activeTool === 'triangle') {
          const tri = new fabric.Triangle({
            left: Math.min(start.x, pointer.x),
            top: Math.min(start.y, pointer.y),
            width: Math.abs(w),
            height: Math.abs(h),
            fill: colors.fill,
            stroke: colors.stroke,
            strokeWidth: 1.5,
            selectable: true,
            evented: true,
          });
          (tri as unknown as Record<string, unknown>)['_layoutShape'] = true;
          (tri as unknown as Record<string, unknown>)['_layoutRole'] = 'none';
          fc.add(tri);
          fc.setActiveObject(tri);
          fc.renderAll();
        }
        setActiveTool('select');
      });

      return () => {
        fc.dispose();
      };
    }

    void init();
    return () => { cancelled = true; };
  }, [activeTool]);

  const handleAssignRole = useCallback((role: LayoutRole) => {
    if (!selectedObject) return;
    const fc = fabricCanvasRef.current as { renderAll: () => void } | null;
    (selectedObject as unknown as Record<string, unknown>)['_layoutRole'] = role;
    const colors = ROLE_COLORS[role];
    (selectedObject as unknown as { set: (props: Record<string, unknown>) => void }).set({
      fill: colors.fill,
      stroke: colors.stroke,
    });
    fc?.renderAll();
  }, [selectedObject]);

  const handleDeleteShape = useCallback(() => {
    if (!selectedObject) return;
    const fc = fabricCanvasRef.current as { remove: (obj: unknown) => void; renderAll: () => void } | null;
    fc?.remove(selectedObject);
    fc?.renderAll();
    setSelectedObject(null);
  }, [selectedObject]);

  const handleClearAll = useCallback(() => {
    const fc = fabricCanvasRef.current as { getObjects: () => unknown[]; remove: (obj: unknown) => void; renderAll: () => void } | null;
    if (!fc) return;
    const shapes = fc.getObjects().filter((o) => (o as unknown as Record<string, unknown>)['_layoutShape']);
    shapes.forEach((o) => fc.remove(o));
    fc.renderAll();
    setSelectedObject(null);
  }, []);

  const handleSaveLayout = useCallback(async () => {
    const fc = fabricCanvasRef.current as { getObjects: () => unknown[] } | null;
    if (!fc) return;
    const shapes = fc.getObjects().filter((o) => (o as unknown as Record<string, unknown>)['_layoutShape']);
    if (shapes.length === 0) {
      toast({ type: 'error', title: 'Nothing to save', description: 'Draw at least one shape first' });
      return;
    }

    setSaving(true);
    try {
      const shapesData = shapes.map((s) => {
        const r = s as unknown as Record<string, unknown>;
        return {
          type: r['type'] ?? 'rect',
          left: r['left'] ?? 0,
          top: r['top'] ?? 0,
          width: r['width'] ?? 100,
          height: r['height'] ?? 100,
          role: (r['_layoutRole'] as LayoutRole) ?? 'none',
          fill: r['fill'] ?? '',
          stroke: r['stroke'] ?? '',
        };
      });

      const res = await fetch('/api/layout-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: layoutName.trim() || 'Custom Layout',
          shapes: shapesData,
          category: 'custom',
        }),
      });

      if (!res.ok) {
        toast({ type: 'error', title: 'Save failed', description: 'Could not save layout template' });
        return;
      }

      toast({ type: 'success', title: 'Layout saved', description: 'Available in the Layouts tab' });
      onDone();
    } catch {
      toast({ type: 'error', title: 'Save failed', description: 'Network error' });
    } finally {
      setSaving(false);
    }
  }, [layoutName, onDone, toast]);

  const selectedRole = selectedObject
    ? ((selectedObject as unknown as Record<string, unknown>)['_layoutRole'] as LayoutRole | undefined) ?? 'none'
    : 'none';

  const hasSelection = selectedObject !== null;

  return (
    <div className="flex-1 flex overflow-hidden bg-surface">
      {/* ── Left: Minimal Toolbar ───────────────────────────── */}
      <aside className="w-[72px] h-full flex-shrink-0 bg-surface flex flex-col items-center py-4 gap-1 overflow-y-auto">
        {/* Tool buttons - icon + label, vertical stack */}
        <ToolButton
          active={activeTool === 'select'}
          onClick={() => setActiveTool('select')}
          label="Select"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4 3L4 15L8 11L12 17L14 15.5L10 10L15 10L4 3Z" fill="currentColor" />
          </svg>
        </ToolButton>
        <ToolButton
          active={activeTool === 'rectangle'}
          onClick={() => setActiveTool('rectangle')}
          label="Rectangle"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="3" y="5" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </ToolButton>
        <ToolButton
          active={activeTool === 'triangle'}
          onClick={() => setActiveTool('triangle')}
          label="Triangle"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 3L17 16H3L10 3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </ToolButton>

        <div className="flex-1" />

        {/* Clear All */}
        <button
          type="button"
          onClick={handleClearAll}
          className="w-14 h-14 flex flex-col items-center justify-center rounded-xl text-[10px] leading-tight text-error hover:bg-error/10 transition-colors"
          title="Clear All"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <span>Clear</span>
        </button>

        {/* Done button at bottom */}
        <div className="w-full px-2 pt-2 border-t border-outline-variant/15 mt-2">
          <button
            type="button"
            onClick={onDone}
            className="w-full rounded-full bg-gradient-to-r from-primary to-primary-dark px-2 py-2 text-xs font-semibold text-white hover:opacity-90 transition-opacity"
          >
            ← Back
          </button>
        </div>
      </aside>

      {/* ── Center: Canvas Area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Floating action pills - top-left */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={handleDeleteShape}
            disabled={!hasSelection}
            className="rounded-full bg-surface-container/80 backdrop-blur-sm px-3 py-1.5 text-xs font-medium transition-colors border border-outline-variant/30 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-error/10 hover:text-error hover:border-error/20"
          >
            Delete
          </button>
        </div>

        {/* Canvas centered */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative overflow-hidden shadow-elevation-2 bg-white">
            <canvas ref={canvasElRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className="block" />
          </div>
        </div>

        {/* Floating save button - bottom-right */}
        <div className="absolute bottom-4 right-4 z-10">
          <button
            type="button"
            onClick={handleSaveLayout}
            disabled={saving}
            className="rounded-full bg-gradient-to-r from-primary to-primary-dark text-white px-6 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-elevation-1"
          >
            {saving ? 'Saving…' : 'Save Layout to Library'}
          </button>
        </div>
      </div>

      {/* ── Right Panel: Minimal ────────────────────────────── */}
      <aside className="w-[280px] h-full flex-shrink-0 flex flex-col bg-surface overflow-hidden">
        {/* Layout Info */}
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface/50 mb-2">Layout Info</p>
          <input
            type="text"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value)}
            placeholder="Layout name…"
            className="w-full px-3 py-2 text-xs rounded-lg border border-outline-variant/20 bg-white/60 text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Role Assignment (only when shape selected) */}
        {hasSelection && (
          <div className="px-4 py-3 border-t border-outline-variant/15">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface/50 mb-2">Assign Role</p>
            <div className="space-y-1">
              {(['block-cell', 'sashing', 'border', 'binding', 'edging'] as LayoutRole[]).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleAssignRole(role)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${selectedRole === role
                      ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                      : 'text-on-surface/70 hover:bg-surface-container'
                    }`}
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: ROLE_COLORS[role].stroke }}
                  />
                  {ROLE_LABELS[role]}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleAssignRole('none')}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors text-on-surface/70 hover:bg-surface-container"
              >
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: ROLE_COLORS['none'].stroke }} />
                No Role
              </button>
            </div>
          </div>
        )}

        {/* Empty state hint */}
        {!hasSelection && (
          <div className="px-4 py-3 border-t border-outline-variant/15">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface/50 mb-2">Select a Shape</p>
            <p className="text-[11px] text-secondary leading-relaxed">
              Click a shape on the canvas to select it, then assign a role from this panel.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  children,
}: {
  readonly active: boolean;
  readonly onClick: () => void;
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl text-[10px] leading-tight transition-all ${active
          ? 'text-primary'
          : 'text-secondary hover:bg-surface-container hover:text-on-surface'
        }`}
      title={label}
    >
      <span className="mb-0.5">{children}</span>
      <span className="text-[10px]">{label}</span>
    </button>
  );
}
