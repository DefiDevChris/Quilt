'use client';

/**
 * DrawingHud — floating dimension readout shown near the cursor during
 * an in-flight drawing gesture (rectangle W×H, polygon segment length, etc).
 *
 * Driven by `quiltstudio:drawing-hud` CustomEvents dispatched from tool hooks
 * via the `showDrawingHud` / `hideDrawingHud` helpers in `@/lib/drawing-hud`.
 */

import { useEffect, useState } from 'react';
import { DRAWING_HUD_EVENT, type DrawingHudDetail } from '@/lib/drawing-hud';

export function DrawingHud() {
  const [state, setState] = useState<DrawingHudDetail | null>(null);

  useEffect(() => {
    function onEvent(e: Event) {
      const detail = (e as CustomEvent<DrawingHudDetail | null>).detail;
      setState(detail ?? null);
    }
    window.addEventListener(DRAWING_HUD_EVENT, onEvent);
    return () => window.removeEventListener(DRAWING_HUD_EVENT, onEvent);
  }, []);

  if (!state) return null;

  // Offset so the readout never sits directly under the cursor hotspot.
  const left = state.clientX + 16;
  const top = state.clientY + 16;

  return (
    <div
      className="pointer-events-none fixed z-[60] select-none rounded border border-[var(--color-border)]/60 bg-[var(--color-bg)]/95 px-2 py-1 font-mono text-xs text-[var(--color-text)] shadow-sm"
      style={{ left, top }}
      aria-hidden="true"
    >
      {state.text}
    </div>
  );
}
