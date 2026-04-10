/**
 * Custom Fabric.js control styling — Figma-like handles.
 *
 * Applies polished, modern selection controls to all Fabric.js objects.
 * Call `applyCustomControls(fabric)` once after creating the canvas.
 *
 * Features:
 *   - Rounded white corner handles with drop shadows
 *   - Circular rotation handle connected by a thin line
 *   - Edge midpoint resize handles
 *   - Clean selection border
 *   - Hover opacity feedback
 */

// ── Theme tokens (aligned with QuiltCorgi design system) ──

const CONTROL_COLOR = '#FFFFFF';
const CONTROL_BORDER = '#f9a06b'; // primary warm orange
const CONTROL_BORDER_HOVER = '#f9a06b'; // coral accent
const SELECTION_BORDER = '#f9a06b';
const SELECTION_BORDER_DASH: number[] = []; // solid line

const CORNER_SIZE = 10;
const CORNER_RADIUS = 3;
const CORNER_STROKE_WIDTH = 1.5;
const CORNER_PADDING = 6;

const ROTATION_OFFSET_Y = -30;
const ROTATION_HANDLE_RADIUS = 6;
const ROTATION_LINE_COLOR = '#f9a06b';
const ROTATION_LINE_WIDTH = 1;

const MIDPOINT_WIDTH = 8;
const MIDPOINT_HEIGHT = 4;

// ── Custom render functions ──

/**
 * Renders a rounded-rect corner handle with a subtle drop shadow.
 */
function renderCornerHandle(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: unknown,
  _fabricObject: unknown
) {
  const half = CORNER_SIZE / 2;

  ctx.save();
  ctx.translate(left, top);

  // Drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  // Rounded rect
  ctx.beginPath();
  ctx.roundRect(-half, -half, CORNER_SIZE, CORNER_SIZE, CORNER_RADIUS);

  ctx.fillStyle = CONTROL_COLOR;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = CONTROL_BORDER;
  ctx.lineWidth = CORNER_STROKE_WIDTH;
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders a midpoint handle (small rectangle for single-axis resize).
 */
function renderMidpointHandle(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: unknown,
  _fabricObject: unknown
) {
  ctx.save();
  ctx.translate(left, top);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  ctx.beginPath();
  ctx.roundRect(-MIDPOINT_WIDTH / 2, -MIDPOINT_HEIGHT / 2, MIDPOINT_WIDTH, MIDPOINT_HEIGHT, 2);

  ctx.fillStyle = CONTROL_COLOR;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = CONTROL_BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders a vertical midpoint handle (for left/right edge resize).
 */
function renderMidpointHandleVertical(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: unknown,
  _fabricObject: unknown
) {
  ctx.save();
  ctx.translate(left, top);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  ctx.beginPath();
  ctx.roundRect(-MIDPOINT_HEIGHT / 2, -MIDPOINT_WIDTH / 2, MIDPOINT_HEIGHT, MIDPOINT_WIDTH, 2);

  ctx.fillStyle = CONTROL_COLOR;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = CONTROL_BORDER;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * Renders a circular rotation handle with a connecting line to the object.
 */
function renderRotationHandle(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  _styleOverride: unknown,
  _fabricObject: unknown
) {
  ctx.save();
  ctx.translate(left, top);

  // Connecting line from handle to object's top center
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -ROTATION_OFFSET_Y - ROTATION_HANDLE_RADIUS);
  ctx.strokeStyle = ROTATION_LINE_COLOR;
  ctx.lineWidth = ROTATION_LINE_WIDTH;
  ctx.stroke();

  // Circle handle
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;

  ctx.beginPath();
  ctx.arc(0, 0, ROTATION_HANDLE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = CONTROL_COLOR;
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = CONTROL_BORDER;
  ctx.lineWidth = CORNER_STROKE_WIDTH;
  ctx.stroke();

  // Rotation icon (curved arrow) inside the circle
  ctx.beginPath();
  ctx.arc(0, 0, 3, -Math.PI * 0.7, Math.PI * 0.5);
  ctx.strokeStyle = CONTROL_BORDER;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // Arrowhead
  const endAngle = Math.PI * 0.5;
  const endX = Math.cos(endAngle) * 3;
  const endY = Math.sin(endAngle) * 3;
  ctx.beginPath();
  ctx.moveTo(endX - 1.5, endY - 2);
  ctx.lineTo(endX, endY);
  ctx.lineTo(endX + 2, endY - 1.5);
  ctx.strokeStyle = CONTROL_BORDER;
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.restore();
}

import * as fabric from 'fabric';

/** Whether the global control customization has already been installed. */
let controlsInstalled = false;

/**
 * Apply modern Figma-like control styling to all Fabric.js objects.
 * Call once after creating the first canvas — repeat calls are no-ops.
 *
 * In Fabric.js v7, controls live on each object instance (assigned in
 * `InteractiveFabricObject`'s constructor via `this.constructor.createControls()`),
 * not on `FabricObject.prototype.controls`. To customize them globally we
 * override the static `createControls` method on `InteractiveFabricObject` so
 * every new object inherits our styled control set, and we set visual
 * defaults via `InteractiveFabricObject.ownDefaults`.
 */
export function applyCustomControls() {
  if (controlsInstalled) return;
  controlsInstalled = true;

  // ── Global object visual defaults (Fabric v7 ownDefaults pattern) ──
  const InteractiveObject = fabric.InteractiveFabricObject as unknown as {
    ownDefaults: Record<string, unknown>;
    createControls: () => { controls: Record<string, fabric.Control> };
  };

  InteractiveObject.ownDefaults = {
    ...InteractiveObject.ownDefaults,
    // Fabric.js v7 changed the default origin from 'left'/'top' to 'center'.
    // The entire codebase (layout renderer, block drop, onObjectMoving bounds
    // check, photo-to-design import, drawing tools, seed data) assumes v5-style
    // top-left origin where `left`/`top` is the unrotated upper-left corner.
    // Restore that assumption globally here so new objects behave consistently.
    originX: 'left',
    originY: 'top',
    borderColor: SELECTION_BORDER,
    borderDashArray: SELECTION_BORDER_DASH,
    borderOpacityWhenMoving: 0.6,
    borderScaleFactor: 1.2,
    cornerColor: CONTROL_COLOR,
    cornerStrokeColor: CONTROL_BORDER,
    cornerSize: CORNER_SIZE,
    transparentCorners: false,
    cornerStyle: 'rect',
    padding: CORNER_PADDING,
    hoverCursor: 'move',
  };

  // Override the static factory so every new object instance gets a styled
  // control set. Subclasses that don't override `createControls` (every shape
  // except Textbox) inherit this via the static prototype chain.
  InteractiveObject.createControls = function () {
    const controls = fabric.controlsUtils.createObjectDefaultControls() as Record<
      string,
      fabric.Control
    >;

    // Corner handles (resize from corners)
    for (const key of ['tl', 'tr', 'bl', 'br'] as const) {
      const c = controls[key];
      if (!c) continue;
      c.render = renderCornerHandle;
      c.sizeX = CORNER_SIZE;
      c.sizeY = CORNER_SIZE;
      c.touchSizeX = CORNER_SIZE + 10;
      c.touchSizeY = CORNER_SIZE + 10;
    }

    // Horizontal midpoint handles (top/bottom edges)
    for (const key of ['mt', 'mb'] as const) {
      const c = controls[key];
      if (!c) continue;
      c.render = renderMidpointHandle;
      c.sizeX = MIDPOINT_WIDTH;
      c.sizeY = MIDPOINT_HEIGHT;
    }

    // Vertical midpoint handles (left/right edges)
    for (const key of ['ml', 'mr'] as const) {
      const c = controls[key];
      if (!c) continue;
      c.render = renderMidpointHandleVertical;
      c.sizeX = MIDPOINT_HEIGHT;
      c.sizeY = MIDPOINT_WIDTH;
    }

    // Rotation handle
    const mtr = controls.mtr;
    if (mtr) {
      mtr.render = renderRotationHandle;
      mtr.sizeX = ROTATION_HANDLE_RADIUS * 2;
      mtr.sizeY = ROTATION_HANDLE_RADIUS * 2;
      mtr.touchSizeX = ROTATION_HANDLE_RADIUS * 2 + 10;
      mtr.touchSizeY = ROTATION_HANDLE_RADIUS * 2 + 10;
      mtr.offsetY = ROTATION_OFFSET_Y;
      mtr.cursorStyle = 'grab';
    }

    return { controls };
  };
}

/**
 * Apply hover highlight effect to a canvas.
 * Adds slight opacity change when hovering over selectable objects.
 */
export function applyHoverEffects(canvas: import('fabric').Canvas) {
  let hoveredObject: import('fabric').FabricObject | null = null;

  canvas.on('mouse:over', (e) => {
    const target = e.target;
    if (!target || !target.selectable) return;
    if (target === canvas.getActiveObject()) return;

    hoveredObject = target;
    target.set({ borderColor: CONTROL_BORDER_HOVER });
    canvas.requestRenderAll();
  });

  canvas.on('mouse:out', (e) => {
    const target = e.target;
    if (!target || target !== hoveredObject) return;

    hoveredObject = null;
    target.set({ borderColor: SELECTION_BORDER });
    canvas.requestRenderAll();
  });
}
