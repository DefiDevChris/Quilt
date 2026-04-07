'use client';

import { PieceInspectorPanel } from '@/components/studio/PieceInspectorPanel';

/**
 * Wrapper for the existing PieceInspectorPanel component.
 *
 * The panel reads its state from `usePieceInspectorStore` and renders
 * the seam-allowance slider, dimensions, and template export actions.
 */
export function PieceInspector() {
  return <PieceInspectorPanel />;
}
