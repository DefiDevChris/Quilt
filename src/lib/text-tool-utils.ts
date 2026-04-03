/**
 * Text tool utilities — pure validation and configuration for quilt text/labels.
 * No React, Fabric.js, or DOM dependencies.
 */

import {
  TEXT_FONTS,
  TEXT_DEFAULT_FONT_SIZE,
  TEXT_DEFAULT_FONT_FAMILY,
  DEFAULT_STROKE_COLOR,
} from '@/lib/constants';
import { clamp } from '@/lib/math-utils';

export const TEXT_FONT_OPTIONS: readonly string[] = TEXT_FONTS;

const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 200;
const MAX_TEXT_LENGTH = 500;

export interface TextConfig {
  readonly text: string;
  readonly fontFamily: string;
  readonly fontSize: number;
  readonly fill: string;
  readonly fontWeight: 'normal' | 'bold';
  readonly fontStyle: 'normal' | 'italic';
  readonly textAlign: 'left' | 'center' | 'right';
}

export function clampFontSize(size: number): number {
  return clamp(size, MIN_FONT_SIZE, MAX_FONT_SIZE);
}

export function validateTextConfig(input: Record<string, unknown>): TextConfig {
  const text = input.text as string | undefined;
  if (!text || typeof text !== 'string' || text.length === 0) {
    throw new Error('Text is required and must be non-empty');
  }
  if (text.length > MAX_TEXT_LENGTH) {
    throw new Error(`Text must be ${MAX_TEXT_LENGTH} characters or fewer`);
  }

  const rawFontSize = typeof input.fontSize === 'number' ? input.fontSize : TEXT_DEFAULT_FONT_SIZE;
  const fontSize = clampFontSize(rawFontSize);

  const fontFamily =
    typeof input.fontFamily === 'string' && input.fontFamily.length > 0
      ? input.fontFamily
      : TEXT_DEFAULT_FONT_FAMILY;

  const fill =
    typeof input.fill === 'string' && input.fill.length > 0 ? input.fill : DEFAULT_STROKE_COLOR;

  const fontWeight = input.fontWeight === 'bold' ? 'bold' : 'normal';

  const fontStyle = input.fontStyle === 'italic' ? 'italic' : 'normal';

  const textAlign =
    input.textAlign === 'center' || input.textAlign === 'right' ? input.textAlign : 'left';

  return { text, fontFamily, fontSize, fill, fontWeight, fontStyle, textAlign };
}
