/**
 * Lightweight drawing-HUD dispatcher.
 *
 * Tools call `showDrawingHud` during a drag to show a floating readout
 * (e.g. `3.25" × 2.00"` or `4.50"`) near the cursor. Call `hideDrawingHud`
 * when the drag ends or is cancelled. The `DrawingHud` component listens
 * for these events and renders the overlay.
 */

import type { UnitSystem } from '@/types/canvas';
import { getPixelsPerUnit } from '@/lib/canvas-utils';

export interface DrawingHudDetail {
  clientX: number;
  clientY: number;
  text: string;
}

export const DRAWING_HUD_EVENT = 'quiltstudio:drawing-hud';

export function showDrawingHud(clientX: number, clientY: number, text: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<DrawingHudDetail | null>(DRAWING_HUD_EVENT, {
      detail: { clientX, clientY, text },
    })
  );
}

export function hideDrawingHud(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<DrawingHudDetail | null>(DRAWING_HUD_EVENT, { detail: null })
  );
}

/**
 * Format a scene-pixel length as a unit-aware string.
 *   imperial → inches with 2 decimals (e.g. `3.25"`)
 *   metric   → centimetres with 1 decimal (e.g. `4.5cm`)
 */
export function formatLength(pixels: number, unitSystem: UnitSystem): string {
  const v = pixels / getPixelsPerUnit(unitSystem);
  return unitSystem === 'imperial' ? `${v.toFixed(2)}"` : `${v.toFixed(1)}cm`;
}
