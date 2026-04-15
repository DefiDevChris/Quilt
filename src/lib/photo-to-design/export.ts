/**
 * Studio export helpers for Photo-to-Design.
 *
 * Builds a `StudioImportPayload` from the current store state and creates a
 * new Project (via POST /api/projects) containing it. The caller is
 * responsible for calling `client.disposeWorker()` BEFORE triggering this so
 * the OpenCV WASM heap frees before navigation.
 */

import type { Patch, ShapeTemplate, StudioImportPayload } from '@/types/photo-to-design';

export interface BuildPayloadInput {
  patches: Patch[];
  templates: ShapeTemplate[];
  unit: 'in' | 'cm';
  gridType: 'rectangular' | 'triangular' | 'hexagonal' | 'none';
  correctedImageUrl?: string;
}

/**
 * Derive a StudioImportPayload from analysis results. quiltWidth/height come
 * from the max x/y across every patch polygon (in real-world units).
 */
export function buildStudioImportPayload(input: BuildPayloadInput): StudioImportPayload {
  const { patches, templates, unit, gridType, correctedImageUrl } = input;

  let maxX = 0;
  let maxY = 0;
  for (const p of patches) {
    for (const pt of p.polygon) {
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  const payload: StudioImportPayload = {
    version: '1.0',
    source: 'photo-to-design',
    metadata: {
      quiltWidth: Math.max(1, maxX),
      quiltHeight: Math.max(1, maxY),
      unit,
      patchCount: patches.length,
      templateCount: templates.length,
      gridType,
    },
    patches: patches.map((p) => ({
      id: String(p.id),
      templateId: p.templateId,
      polygon: p.polygon,
      fill: p.dominantColor,
      colorPalette: p.colorPalette,
      swatch: p.fabricSwatch,
    })),
    templates: templates.map((t) => ({ ...t })),
  };

  if (correctedImageUrl) {
    payload.correctedImageUrl = correctedImageUrl;
  }

  return payload;
}

/**
 * Clamp `quiltWidth` / `quiltHeight` to the Project schema's [1, 200] range.
 * Projects above the limit are truncated to a fitting canvas; the Studio can
 * re-fit later if needed.
 */
function clampCanvasDim(n: number): number {
  return Math.max(1, Math.min(200, Math.round(n)));
}

export interface CreatePhotoProjectResult {
  projectId: string;
}

/**
 * Create a new Project seeded with the photo-to-design payload. Returns the
 * new project id. Throws on failure.
 */
export async function createPhotoProject(
  payload: StudioImportPayload,
  projectName: string
): Promise<CreatePhotoProjectResult> {
  const canvasWidth = clampCanvasDim(payload.metadata.quiltWidth);
  const canvasHeight = clampCanvasDim(payload.metadata.quiltHeight);
  const unitSystem = payload.metadata.unit === 'in' ? 'imperial' : 'metric';

  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: projectName,
      unitSystem,
      canvasWidth,
      canvasHeight,
      canvasData: {
        photoToDesign: payload,
        initialSetup: {
          kind: 'photo-to-design',
          unit: payload.metadata.unit,
        },
      },
    }),
  });

  const body = (await res.json()) as { success: boolean; data?: { id: string }; error?: string };
  if (!res.ok || !body.success || !body.data) {
    throw new Error(body.error ?? 'Failed to create project.');
  }
  return { projectId: body.data.id };
}
