/**
 * Image tracing utilities — pure validation and helpers for reference image features.
 * No React, Fabric.js, or DOM dependencies.
 */

import { ACCEPTED_IMAGE_TYPES } from '@/lib/constants';
import { clamp } from '@/lib/math-utils';

/**
 * Checks whether the given MIME type is an accepted image type.
 */
export function isValidImageType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

/**
 * Clamps an opacity value to the valid range [0, 1].
 * Returns 1 for invalid (non-finite) inputs.
 */
export function clampOpacity(value: number): number {
  return clamp(value, 0, 1);
}
