/**
 * Standard quilt-size presets shown in the freeform Phase 1 catalog.
 *
 * These dimensions are in inches and reflect typical finished quilt sizes
 * for the named beddings. Users can pick one as a starting point or use
 * the Custom preset (sliders default to its values) to enter their own.
 */
export interface QuiltSizePreset {
  id: string;
  name: string;
  description: string;
  /** Finished width in inches. */
  width: number;
  /** Finished height in inches. */
  height: number;
}

export const QUILT_SIZE_PRESETS: QuiltSizePreset[] = [
  {
    id: 'crib',
    name: 'Crib',
    description: 'Small quilts for cribs and baby blankets',
    width: 36,
    height: 52,
  },
  {
    id: 'throw',
    name: 'Throw',
    description: 'Couch-friendly throw blankets',
    width: 50,
    height: 65,
  },
  {
    id: 'twin',
    name: 'Twin',
    description: 'Standard twin bed quilts',
    width: 70,
    height: 90,
  },
  {
    id: 'full',
    name: 'Full / Double',
    description: 'Full-size or double bed quilts',
    width: 84,
    height: 96,
  },
  {
    id: 'queen',
    name: 'Queen',
    description: 'Queen bed quilts',
    width: 88,
    height: 96,
  },
  {
    id: 'king',
    name: 'King',
    description: 'Standard king bed quilts',
    width: 100,
    height: 110,
  },
  {
    id: 'wallhanging',
    name: 'Wall Hanging',
    description: 'Decorative wall pieces',
    width: 36,
    height: 36,
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Use the sliders to set any dimensions',
    width: 50,
    height: 65,
  },
];

export function getQuiltSizePreset(id: string): QuiltSizePreset | undefined {
  return QUILT_SIZE_PRESETS.find((p) => p.id === id);
}
