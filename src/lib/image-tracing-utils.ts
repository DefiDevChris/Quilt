import { clamp } from './math-utils';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export function isValidImageType(type: string): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(type as (typeof ACCEPTED_IMAGE_TYPES)[number]);
}

export function clampOpacity(value: number): number {
  return clamp(value, 0, 1);
}
