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
const CONTROL_BORDER = '#D4883C'; // primary warm orange
const CONTROL_BORDER_HOVER = '#E07B67'; // coral accent
const SELECTION_BORDER = '#D4883C';
const SELECTION_BORDER_DASH: number[] = []; // solid line

const CORNER_SIZE = 10;
const CORNER_RADIUS = 3;
const CORNER_STROKE_WIDTH = 1.5;
const CORNER_PADDING = 6;

const ROTATION_OFFSET_Y = -30;
const ROTATION_HANDLE_RADIUS = 6;
const ROTATION_LINE_COLOR = '#D4883C';
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

/**
 * Apply modern Figma-like control styling to all Fabric.js objects.
 * Call once after canvas creation.
 */
export function applyCustomControls() {
  // ── Global object defaults ──
  const proto = fabric.FabricObject.prototype;

  // Selection border
  proto.borderColor = SELECTION_BORDER;
  proto.borderDashArray = SELECTION_BORDER_DASH;
  proto.borderOpacityWhenMoving = 0.6;
  proto.borderScaleFactor = 1.2;

  // Control handles
  proto.cornerColor = CONTROL_COLOR;
  proto.cornerStrokeColor = CONTROL_BORDER;
  proto.cornerSize = CORNER_SIZE;
  proto.transparentCorners = false;
  proto.cornerStyle = 'rect';
  proto.padding = CORNER_PADDING;

  // Hover cursor
  proto.hoverCursor = 'move';

  // Apply custom render functions to the default controls
  const controls = proto.controls;

  // Corner handles (resize from corners)
  const cornerKeys = ['tl', 'tr', 'bl', 'br'];
  for (const key of cornerKeys) {
    if (controls[key]) {
      controls[key].render = renderCornerHandle;
      controls[key].sizeX = CORNER_SIZE;
      controls[key].sizeY = CORNER_SIZE;
      controls[key].touchSizeX = CORNER_SIZE + 10;
      controls[key].touchSizeY = CORNER_SIZE + 10;
    }
  }

  // Midpoint handles (resize from edges)
  const hMidKeys = ['mt', 'mb']; // horizontal midpoints
  for (const key of hMidKeys) {
    if (controls[key]) {
      controls[key].render = renderMidpointHandle;
      controls[key].sizeX = MIDPOINT_WIDTH;
      controls[key].sizeY = MIDPOINT_HEIGHT;
    }
  }

  const vMidKeys = ['ml', 'mr']; // vertical midpoints
  for (const key of vMidKeys) {
    if (controls[key]) {
      controls[key].render = renderMidpointHandleVertical;
      controls[key].sizeX = MIDPOINT_HEIGHT;
      controls[key].sizeY = MIDPOINT_WIDTH;
    }
  }

  // Rotation handle
  if (controls.mtr) {
    controls.mtr.render = renderRotationHandle;
    controls.mtr.sizeX = ROTATION_HANDLE_RADIUS * 2;
    controls.mtr.sizeY = ROTATION_HANDLE_RADIUS * 2;
    controls.mtr.touchSizeX = ROTATION_HANDLE_RADIUS * 2 + 10;
    controls.mtr.touchSizeY = ROTATION_HANDLE_RADIUS * 2 + 10;
    controls.mtr.offsetY = ROTATION_OFFSET_Y;
    controls.mtr.cursorStyle = 'grab';
  }
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
