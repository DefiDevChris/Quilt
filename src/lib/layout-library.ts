/**
 * Layout Library — Predefined quilt layout presets
 *
 * Currently empty — user will populate via Layout Creator or admin seeding.
 */

import type { LayoutConfig } from '@/lib/layout-utils';

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  category: 'grid' | 'sashing' | 'on-point';
  config: Omit<LayoutConfig, 'type'> & { type: 'grid' | 'sashing' | 'on-point' };
}

export const LAYOUT_PRESETS: LayoutPreset[] = [];

export const PRESET_SVG: Record<string, string> = {};

export function getLayoutPreset(id: string): LayoutPreset | undefined {
  return LAYOUT_PRESETS.find((p) => p.id === id);
}
