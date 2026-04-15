/// <reference lib="webworker" />
import type { InMessage, OutMessage } from './messages';
import type {
  Point,
  ProcessParams,
  Patch,
  ShapeTemplate,
  DetectedGrid,
} from '@/types/photo-to-design';
import { MatRegistry } from './cv/mat-registry';
import { waitForOpenCVReady } from './cv/opencv-init';
import { runPipeline, PipelineError } from './cv/pipeline';
import {
  splitPatchImpl,
  mergePatchesImpl,
  floodFillImpl,
  rebuildPatches,
  labelAt,
  findSeamPair,
} from './cv/edits';
import { LabelMapHistory } from './cv/rle-history';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Worker-scope state persisted across messages ───────────────────────────
let cv: any = null;
let reg: MatRegistry | null = null;
let correctedImageData: ImageData | null = null;

/** Persisted label map after the last successful full pipeline run. */
let labelMat: any = null;
let labelMapWidth = 0;
let labelMapHeight = 0;
/** Scale factor applied in stage 1 (scaledSize / originalSize). */
let labelMapScale = 1;
/** Last ProcessParams used for a full run (needed to recompute coords on edits). */
let lastFullParams: ProcessParams | null = null;
/** The Patch list mirrored from the last fullResult / editResult. */
let patchesById: Map<number, Patch> = new Map();
/** templateId lookup per patch id (persisted across edits). */
let templateIdByPatch: Map<number, string> = new Map();

/** RLE history of label-map snapshots for undo/redo. */
const history = new LabelMapHistory(15);

// ── Message router ─────────────────────────────────────────────────────────

self.onmessage = async (e: MessageEvent<InMessage>) => {
  const msg = e.data;
  try {
    switch (msg.type) {
      case 'init':
        return handleInit(msg.requestId);
      case 'loadImage':
        return handleLoadImage(msg.requestId, msg.payload);
      case 'autoDetectCorners':
        return handleAutoDetectCorners(msg.requestId, msg.payload);
      case 'warpPerspective':
        return handleWarpPerspective(msg.requestId, msg.payload);
      case 'process':
        return handleProcess(msg.requestId, msg.payload);
      case 'splitPatch':
        return handleSplitPatch(msg.requestId, msg.payload);
      case 'mergePatches':
        return handleMergePatches(msg.requestId, msg.payload);
      case 'findSeamPair':
        return handleFindSeamPair(msg.requestId, msg.payload);
      case 'floodFill':
        return handleFloodFill(msg.requestId, msg.payload);
      case 'undo':
        return handleUndo(msg.requestId);
      case 'redo':
        return handleRedo(msg.requestId);
      case 'dispose':
        return handleDispose(msg.requestId);
      default: {
        const _exhaustive: never = msg;
        post({
          type: 'error',
          requestId: (msg as InMessage).requestId,
          stage: 'router',
          message: `Unknown message type: ${(msg as { type: string }).type}`,
          recoverable: false,
        });
        void _exhaustive;
      }
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    post({
      type: 'error',
      requestId: (msg as InMessage).requestId,
      stage: (msg as InMessage).type,
      message: error.message,
      recoverable: false,
    });
  }
};

// ── Handlers ───────────────────────────────────────────────────────────────

async function handleInit(requestId: string) {
  if (cv) {
    post({ type: 'response', requestId, payload: { ok: true } });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  self.importScripts('/opencv/opencv.js');
  cv = (self as any).cv;
  await waitForOpenCVReady(cv);
  reg = new MatRegistry(cv);

  post({ type: 'response', requestId, payload: { ok: true } });
  post({ type: 'ready', requestId: '' });
}

function handleLoadImage(requestId: string, payload: { imageData: ImageData }) {
  correctedImageData = payload.imageData;
  post({ type: 'response', requestId, payload: { ok: true } });
}

function handleAutoDetectCorners(requestId: string, payload: { imageData: ImageData }) {
  if (!cv || !reg) {
    post({
      type: 'error',
      requestId,
      stage: 'autoDetectCorners',
      message: 'OpenCV not initialized.',
      recoverable: false,
    });
    return;
  }

  const localReg = new MatRegistry(cv);
  try {
    const src = localReg.adopt('src', cv.matFromImageData(payload.imageData));

    // Convert to grayscale
    const gray = localReg.create('gray');
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    // Canny edge detection
    const edges = localReg.create('edges');
    cv.Canny(gray, edges, 50, 150, 3);

    // HoughLinesP to find line segments
    const lines = localReg.create('lines');
    cv.HoughLinesP(edges, lines, 1, Math.PI / 180, 50, 50, 10);

    // Extract line segments
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const linesMat = lines as any;
    const segments: Array<{ x1: number; y1: number; x2: number; y2: number; angle: number }> = [];
    for (let i = 0; i < linesMat.rows; i++) {
      const x1 = linesMat.intAt(i, 0);
      const y1 = linesMat.intAt(i, 1);
      const x2 = linesMat.intAt(i, 2);
      const y2 = linesMat.intAt(i, 3);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      // Normalize angle to 0-PI
      const normalizedAngle = angle < 0 ? angle + Math.PI : angle;
      segments.push({ x1, y1, x2, y2, angle: normalizedAngle });
    }

    if (segments.length < 4) {
      post({ type: 'response', requestId, payload: { ok: true, corners: null } });
      return;
    }

    // Cluster lines by angle (group similar angles)
    const angleClusters = clusterAngles(segments, Math.PI / 18); // 10-degree tolerance

    // Need at least 2 dominant angle groups (e.g., horizontal + vertical)
    if (angleClusters.length < 2) {
      post({ type: 'response', requestId, payload: { ok: true, corners: null } });
      return;
    }

    // Take the two largest clusters
    angleClusters.sort((a, b) => b.lines.length - a.lines.length);
    const clusterA = angleClusters[0];
    const clusterB = angleClusters[1];

    // Find representative lines from each cluster (longest ones)
    const linesA = clusterA.lines.sort(lineLength).slice(-4);
    const linesB = clusterB.lines.sort(lineLength).slice(-4);

    // Compute intersections between lines from different clusters
    const intersections: Array<{ x: number; y: number }> = [];
    for (const la of linesA) {
      for (const lb of linesB) {
        const pt = lineIntersection(la, lb);
        if (pt) {
          intersections.push(pt);
        }
      }
    }

    if (intersections.length < 4) {
      post({ type: 'response', requestId, payload: { ok: true, corners: null } });
      return;
    }

    // Pick the 4 intersections that form the largest quadrilateral
    // containing the image center
    const centerX = payload.imageData.width / 2;
    const centerY = payload.imageData.height / 2;

    // Sort by distance from center, take the 4 furthest that form a valid quad
    const sorted = intersections
      .filter((p) => isValidPoint(p, payload.imageData))
      .sort((a, b) => {
        const da = Math.hypot(a.x - centerX, a.y - centerY);
        const db = Math.hypot(b.x - centerX, b.y - centerY);
        return db - da; // furthest first
      });

    if (sorted.length < 4) {
      post({ type: 'response', requestId, payload: { ok: true, corners: null } });
      return;
    }

    // Take 4 corners and order them as TL, TR, BR, BL
    const candidates = sorted.slice(0, Math.min(8, sorted.length));
    const corners = findBestQuad(candidates, centerX, centerY);

    if (!corners) {
      post({ type: 'response', requestId, payload: { ok: true, corners: null } });
      return;
    }

    post({ type: 'response', requestId, payload: { ok: true, corners } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Auto-detect failed.';
    post({
      type: 'error',
      requestId,
      stage: 'autoDetectCorners',
      message,
      recoverable: true,
    });
  } finally {
    localReg.deleteAll();
  }
}

function handleWarpPerspective(
  requestId: string,
  payload: { corners: Point[]; imageData: ImageData }
) {
  if (!cv || !reg) {
    post({
      type: 'error',
      requestId,
      stage: 'warpPerspective',
      message: 'OpenCV not initialized.',
      recoverable: false,
    });
    return;
  }

  const localReg = new MatRegistry(cv);
  try {
    const { corners, imageData: srcImageData } = payload;
    const src = localReg.adopt('src', cv.matFromImageData(srcImageData));

    // Compute destination dimensions
    const [tl, tr, br, bl] = corners;
    const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
    const widthBottom = Math.hypot(br.x - bl.x, br.y - bl.y);
    const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
    const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y);

    const dstWidth = Math.min(
      Math.round(Math.max(widthTop, widthBottom)),
      srcImageData.width // Clamp to source resolution
    );
    const dstHeight = Math.min(
      Math.round(Math.max(heightLeft, heightRight)),
      srcImageData.height // Clamp to source resolution
    );

    // Source points (TL, TR, BR, BL as Float32)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const srcPoints = localReg.create('srcPoints', 4, 1, cv.CV_32FC2) as any;
    srcPoints.data32F.set([tl.x, tl.y, tr.x, tr.y, br.x, br.y, bl.x, bl.y]);

    // Destination points
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dstPoints = localReg.create('dstPoints', 4, 1, cv.CV_32FC2) as any;
    dstPoints.data32F.set([0, 0, dstWidth, 0, dstWidth, dstHeight, 0, dstHeight]);

    // Perspective transform
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const M = localReg.adopt('M', cv.getPerspectiveTransform(srcPoints, dstPoints)) as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dst = localReg.create('dst', dstHeight, dstWidth, cv.CV_8UC4) as any;

    cv.warpPerspective(
      src,
      dst,
      M,
      new cv.Size(dstWidth, dstHeight),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );

    // Extract ImageData and send back via Transferable
    const imageData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);

    post({ type: 'response', requestId, payload: { ok: true, imageData } }, [
      imageData.data.buffer,
    ]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Warp perspective failed.';
    post({
      type: 'error',
      requestId,
      stage: 'warpPerspective',
      message,
      recoverable: true,
    });
  } finally {
    localReg.deleteAll();
  }
}

// ── Geometry helpers for auto-detect ───────────────────────────────────────

interface Line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angle: number;
}

function lineLength(l: Line): number {
  return Math.hypot(l.x2 - l.x1, l.y2 - l.y1);
}

/** Cluster line segments by their angle. */
function clusterAngles(
  segments: Line[],
  tolerance: number
): Array<{ angle: number; lines: Line[] }> {
  const clusters: Array<{ angle: number; lines: Line[] }> = [];

  for (const seg of segments) {
    let assigned = false;
    for (const cluster of clusters) {
      let diff = Math.abs(seg.angle - cluster.angle);
      if (diff > Math.PI / 2) diff = Math.PI - diff;
      if (diff <= tolerance) {
        cluster.lines.push(seg);
        // Update cluster average
        cluster.angle = cluster.lines.reduce((sum, l) => sum + l.angle, 0) / cluster.lines.length;
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      clusters.push({ angle: seg.angle, lines: [seg] });
    }
  }

  return clusters;
}

/** Compute intersection point of two line segments (if they intersect when extended). */
function lineIntersection(a: Line, b: Line): { x: number; y: number } | null {
  const dx1 = a.x2 - a.x1;
  const dy1 = a.y2 - a.y1;
  const dx2 = b.x2 - b.x1;
  const dy2 = b.y2 - b.y1;

  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-6) return null; // Parallel

  const t = ((b.x1 - a.x1) * dy2 - (b.y1 - a.y1) * dx2) / denom;

  // Intersection point
  return {
    x: a.x1 + t * dx1,
    y: a.y1 + t * dy1,
  };
}

function isValidPoint(p: { x: number; y: number }, imageData: ImageData): boolean {
  const margin = 50;
  return (
    p.x >= -margin &&
    p.x <= imageData.width + margin &&
    p.y >= -margin &&
    p.y <= imageData.height + margin
  );
}

/** Find the best 4 points that form a quadrilateral containing the center. */
function findBestQuad(
  candidates: Array<{ x: number; y: number }>,
  centerX: number,
  centerY: number
): [Point, Point, Point, Point] | null {
  if (candidates.length < 4) return null;

  // Sort candidates by angle from center to get a natural ordering
  const withAngle = candidates.map((p) => ({
    ...p,
    angle: Math.atan2(p.y - centerY, p.x - centerX),
  }));

  // Sort by angle (counter-clockwise from top)
  withAngle.sort((a, b) => a.angle - b.angle);

  // If we have exactly 4, use them in angular order
  if (withAngle.length === 4) {
    // Angular order gives us a quad, but we need TL, TR, BR, BL
    // Reorder by position
    const pts = withAngle.map(({ x, y }) => ({ x, y }));
    return orderByPosition(pts);
  }

  // If more than 4, try to pick the 4 that form the largest area quad
  let bestQuad: [Point, Point, Point, Point] | null = null;
  let bestArea = 0;

  // Try combinations of 4 from the first 8 candidates (limit to avoid O(n^4))
  const subset = withAngle.slice(0, Math.min(8, withAngle.length));
  for (let i = 0; i < subset.length; i++) {
    for (let j = i + 1; j < subset.length; j++) {
      for (let k = j + 1; k < subset.length; k++) {
        for (let l = k + 1; l < subset.length; l++) {
          const quad = orderByPosition([
            { x: subset[i].x, y: subset[i].y },
            { x: subset[j].x, y: subset[j].y },
            { x: subset[k].x, y: subset[k].y },
            { x: subset[l].x, y: subset[l].y },
          ]);
          if (quad) {
            const area = quadArea(quad);
            if (area > bestArea) {
              bestArea = area;
              bestQuad = quad;
            }
          }
        }
      }
    }
  }

  return bestQuad;
}

/** Order 4 points as TL, TR, BR, BL based on position. */
function orderByPosition(
  pts: Array<{ x: number; y: number }>
): [Point, Point, Point, Point] | null {
  if (pts.length !== 4) return null;

  // Sort by y to get top/bottom
  const sorted = [...pts].sort((a, b) => a.y - b.y);
  const topTwo = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottomTwo = sorted.slice(2, 4).sort((a, b) => a.x - b.x);

  return [
    { x: topTwo[0].x, y: topTwo[0].y }, // TL
    { x: topTwo[1].x, y: topTwo[1].y }, // TR
    { x: bottomTwo[1].x, y: bottomTwo[1].y }, // BR
    { x: bottomTwo[0].x, y: bottomTwo[0].y }, // BL
  ];
}

/** Compute area of a quadrilateral (shoelace formula). */
function quadArea(quad: [Point, Point, Point, Point]): number {
  const [tl, tr, br, bl] = quad;
  return (
    Math.abs(
      tl.x * tr.y +
        tr.x * br.y +
        br.x * bl.y +
        bl.x * tl.y -
        (tl.y * tr.x + tr.y * br.x + br.y * bl.x + bl.y * tl.x)
    ) / 2
  );
}

function handleProcess(
  requestId: string,
  payload: { params: ProcessParams; quality: 'preview' | 'full' }
) {
  if (!cv || !reg) {
    post({
      type: 'error',
      requestId,
      stage: 'process',
      message: 'OpenCV not initialized.',
      recoverable: false,
    });
    return;
  }

  if (!correctedImageData) {
    post({
      type: 'error',
      requestId,
      stage: 'process',
      message: 'No image loaded. Run loadImage first.',
      recoverable: false,
    });
    return;
  }

  const { params, quality } = payload;
  const localReg = new MatRegistry(cv);

  // Progress callback
  const progress = (stage: string, percent: number) => {
    post({ type: 'progress', requestId, stage, percent });
  };

  try {
    let result;
    try {
      result = runPipeline(cv, localReg, correctedImageData, params, quality, progress);
    } catch (err) {
      // Error table row: RangeError during mat creation — auto-downscale
      // to 2048 long edge and retry once.
      const message = err instanceof Error ? err.message : String(err);
      const isRangeError =
        err instanceof RangeError || /RangeError|out of memory|allocation/i.test(message);
      if (!isRangeError || !correctedImageData) throw err;
      localReg.deleteAll();
      post({
        type: 'progress',
        requestId,
        stage: 'downscale-retry',
        percent: 0,
      });
      const downscaled = downscaleImageDataLongEdge(correctedImageData, 2048);
      correctedImageData = downscaled;
      result = runPipeline(cv, localReg, downscaled, params, quality, progress);
    }

    if (quality === 'preview') {
      const previewResult = result as {
        outlines: Float32Array;
        colors: string[];
        patchCount: number;
      };
      post(
        {
          type: 'previewResult',
          requestId,
          outlines: previewResult.outlines,
          colors: previewResult.colors,
          patchCount: previewResult.patchCount,
        },
        [previewResult.outlines.buffer]
      );
    } else {
      const fullResult = result as {
        patches: Patch[];
        templates: ShapeTemplate[];
        grid: DetectedGrid;
        labelMat: any;
        scale: number;
        scaledWidth: number;
        scaledHeight: number;
      };

      // Persist label-map + metadata for subsequent edits.
      if (labelMat) {
        labelMat.delete();
        labelMat = null;
      }
      if (reg) {
        const persistName = `persisted-label-${Date.now()}`;
        const persisted = reg.create(
          persistName,
          fullResult.scaledHeight,
          fullResult.scaledWidth,
          cv.CV_32S
        ) as any;
        (persisted.data32S as Int32Array).set(fullResult.labelMat.data32S as Int32Array);
        labelMat = persisted;
        labelMapWidth = fullResult.scaledWidth;
        labelMapHeight = fullResult.scaledHeight;
        labelMapScale = fullResult.scale;
        lastFullParams = params;
        patchesById = new Map(fullResult.patches.map((p: Patch) => [p.id, p]));
        templateIdByPatch = new Map(fullResult.patches.map((p: Patch) => [p.id, p.templateId]));

        // Seed history with the initial snapshot.
        history.reset();
        history.push(persisted.data32S as Int32Array);
        post({
          type: 'undoRedoState',
          requestId,
          canUndo: history.canUndo,
          canRedo: history.canRedo,
        });
      }

      post({
        type: 'fullResult',
        requestId,
        patches: fullResult.patches,
        templates: fullResult.templates,
        grid: fullResult.grid,
      });

      // Spec error-table row: >500 patches suggests over-segmentation.
      // Emit as a recoverable error after the result is delivered so the UI
      // still renders; users act by raising Smoothing / Min Patch Size.
      if (fullResult.patches.length > 500) {
        post({
          type: 'error',
          requestId,
          stage: 'process',
          message: 'Found many small patches — try increasing Smoothing or Min Patch Size.',
          recoverable: true,
        });
      }
    }

    progress('done', 100);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Pipeline failed.';
    const recoverable = err instanceof PipelineError ? err.recoverable : true;

    post({
      type: 'error',
      requestId,
      stage: 'process',
      message,
      recoverable,
    });
  } finally {
    localReg.deleteAll();
  }
}

// ── Manual edits ───────────────────────────────────────────────────────────

function ensureEditReady(requestId: string, stage: string): boolean {
  if (!cv || !reg || !labelMat || !lastFullParams || !correctedImageData) {
    post({
      type: 'error',
      requestId,
      stage,
      message: 'No analysis available. Run a full pipeline first.',
      recoverable: false,
    });
    return false;
  }
  return true;
}

function emitEditResult(requestId: string, affectedIds: number[], extraRemovedIds: number[] = []) {
  if (!cv || !reg || !labelMat || !lastFullParams || !correctedImageData) return;
  const editReg = new MatRegistry(cv);
  try {
    const { patches, removedIds } = rebuildPatches(
      cv,
      editReg,
      labelMat,
      labelMapWidth,
      labelMapHeight,
      affectedIds,
      labelMapScale,
      lastFullParams,
      correctedImageData,
      templateIdByPatch
    );

    // Mirror the new patches back into our in-memory store.
    for (const p of patches) {
      patchesById.set(p.id, p);
      templateIdByPatch.set(p.id, p.templateId);
    }
    const combinedRemoved = [...removedIds, ...extraRemovedIds];
    for (const id of combinedRemoved) {
      patchesById.delete(id);
      templateIdByPatch.delete(id);
    }

    post({
      type: 'editResult',
      requestId,
      changedPatches: patches,
      removedIds: combinedRemoved,
    });
  } finally {
    editReg.deleteAll();
  }
}

function pushHistoryAndNotify(requestId: string) {
  if (!labelMat) return;
  history.push(labelMat.data32S as Int32Array);
  post({
    type: 'undoRedoState',
    requestId,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  });
}

function handleSplitPatch(requestId: string, payload: { patchId: number; line: [Point, Point] }) {
  if (!ensureEditReady(requestId, 'splitPatch')) return;
  const result = splitPatchImpl(
    cv,
    reg!,
    labelMat,
    payload.patchId,
    payload.line,
    labelMapWidth,
    labelMapHeight,
    true
  );
  if (!result.success) {
    post({
      type: 'error',
      requestId,
      stage: 'splitPatch',
      message: result.message ?? "Line didn't split the patch.",
      recoverable: true,
    });
    return;
  }
  pushHistoryAndNotify(requestId);
  emitEditResult(requestId, result.newIds);
}

function handleFindSeamPair(requestId: string, payload: { point: Point }) {
  if (!ensureEditReady(requestId, 'findSeamPair')) return;
  // Caller passes an original-image pixel coord; convert to label-map space.
  const scaled: Point = {
    x: payload.point.x * labelMapScale,
    y: payload.point.y * labelMapScale,
  };
  const pair = findSeamPair(labelMat, labelMapWidth, labelMapHeight, scaled);
  post({ type: 'response', requestId, payload: { ok: true, pair } });
}

function handleMergePatches(requestId: string, payload: { aId: number; bId: number }) {
  if (!ensureEditReady(requestId, 'mergePatches')) return;
  const { aId, bId } = payload;
  const changed = mergePatchesImpl(labelMat, aId, bId, labelMapWidth, labelMapHeight);
  if (changed === 0) {
    post({
      type: 'error',
      requestId,
      stage: 'mergePatches',
      message: 'Nothing to merge — patches may already be the same.',
      recoverable: true,
    });
    return;
  }
  pushHistoryAndNotify(requestId);
  emitEditResult(requestId, [aId], [bId]);
}

function handleFloodFill(requestId: string, payload: { point: Point; targetId: number }) {
  if (!ensureEditReady(requestId, 'floodFill')) return;
  const { point, targetId } = payload;
  // Scale from original-image pixel coords (what main-thread knows) into label-map coords.
  const scaledPoint: Point = {
    x: point.x * labelMapScale,
    y: point.y * labelMapScale,
  };
  const clickedId = labelAt(labelMat, labelMapWidth, labelMapHeight, scaledPoint.x, scaledPoint.y);
  if (clickedId === 0 || clickedId === targetId) {
    post({
      type: 'error',
      requestId,
      stage: 'floodFill',
      message: 'Click inside a patch different from the target.',
      recoverable: true,
    });
    return;
  }
  const result = floodFillImpl(
    cv,
    reg!,
    labelMat,
    scaledPoint,
    targetId,
    labelMapWidth,
    labelMapHeight
  );
  if (!result) {
    post({
      type: 'error',
      requestId,
      stage: 'floodFill',
      message: 'Flood fill could not locate a region at that point.',
      recoverable: true,
    });
    return;
  }
  pushHistoryAndNotify(requestId);
  // Both the source and target patches may have changed outline/color.
  emitEditResult(requestId, [result.fromId, result.toId]);
}

function handleUndo(requestId: string) {
  if (!ensureEditReady(requestId, 'undo')) return;
  const ok = history.undo(labelMat.data32S as Int32Array);
  if (!ok) {
    post({
      type: 'undoRedoState',
      requestId,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    });
    return;
  }
  post({
    type: 'undoRedoState',
    requestId,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  });
  // After undo, the set of patches may have grown/shrunk. Rebuild for all
  // current IDs in the map (bounded by ~hundreds of patches, so fine).
  emitEditResult(requestId, collectAllIds(), diffRemoved(collectAllIds()));
}

function handleRedo(requestId: string) {
  if (!ensureEditReady(requestId, 'redo')) return;
  const ok = history.redo(labelMat.data32S as Int32Array);
  if (!ok) {
    post({
      type: 'undoRedoState',
      requestId,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    });
    return;
  }
  post({
    type: 'undoRedoState',
    requestId,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
  });
  emitEditResult(requestId, collectAllIds(), diffRemoved(collectAllIds()));
}

/** Collect every non-zero patch ID currently present in the label map. */
function collectAllIds(): number[] {
  if (!labelMat) return [];
  const ids = new Set<number>();
  const data = labelMat.data32S as Int32Array;
  const n = labelMapWidth * labelMapHeight;
  for (let i = 0; i < n; i++) {
    const v = data[i];
    if (v !== 0) ids.add(v);
  }
  return [...ids];
}

/** Return IDs that were tracked before but no longer appear in the label map. */
function diffRemoved(currentIds: number[]): number[] {
  const set = new Set(currentIds);
  const removed: number[] = [];
  for (const id of patchesById.keys()) {
    if (!set.has(id)) removed.push(id);
  }
  return removed;
}

function handleDispose(_requestId: string) {
  if (reg) {
    reg.deleteAll();
  }
  correctedImageData = null;
  cv = null;
  reg = null;
  labelMat = null;
  labelMapWidth = 0;
  labelMapHeight = 0;
  labelMapScale = 1;
  lastFullParams = null;
  patchesById = new Map();
  templateIdByPatch = new Map();
  history.reset();
  // Let the host terminate us, but self-close so there is no idle worker in
  // the rare case where the main thread forgets to call worker.terminate().
  try {
    (self as unknown as { close?: () => void }).close?.();
  } catch {
    /* some environments (jsdom, tests) lack close() — ignore */
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Downscale an ImageData so its long edge is at most `maxEdge`. Used on
 * RangeError retry when the source was too large for the WASM heap.
 * Simple bilinear: good enough for retry, never hit on normal flows.
 */
function downscaleImageDataLongEdge(source: ImageData, maxEdge: number): ImageData {
  const { width, height, data } = source;
  const longEdge = Math.max(width, height);
  if (longEdge <= maxEdge) return source;

  const scale = maxEdge / longEdge;
  const dstW = Math.max(1, Math.round(width * scale));
  const dstH = Math.max(1, Math.round(height * scale));
  const dst = new Uint8ClampedArray(dstW * dstH * 4);

  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(height - 1, Math.floor(y / scale));
    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(width - 1, Math.floor(x / scale));
      const si = (sy * width + sx) * 4;
      const di = (y * dstW + x) * 4;
      dst[di] = data[si];
      dst[di + 1] = data[si + 1];
      dst[di + 2] = data[si + 2];
      dst[di + 3] = data[si + 3];
    }
  }
  return new ImageData(dst, dstW, dstH);
}

function post(msg: OutMessage, transfer?: Transferable[]) {
  if (transfer) {
    (
      self as unknown as { postMessage: (msg: OutMessage, opts: Transferable[]) => void }
    ).postMessage(msg, transfer);
  } else {
    (self as unknown as Worker).postMessage(msg);
  }
}
