/**
 * Block Generator Aggregator
 * Collects all procedurally generated blocks from category-specific generators.
 */

import type { BlockDefinition } from '../blockDefinitions';
import { generateStarVariations } from './star-variations';
import { generateLogCabinVariations } from './log-cabin-variations';
import { generatePinwheelVariations } from './pinwheel-variations';
import { generatePictorialBlocks } from './pictorial-generator';
import { generateHolidayBlocks } from './holiday-generator';
import { generateArtDecoBlocks } from './art-deco-generator';
import { generateCelticBlocks } from './celtic-generator';

export function getGeneratedBlocks(): BlockDefinition[] {
  return [
    ...generateStarVariations(),
    ...generateLogCabinVariations(),
    ...generatePinwheelVariations(),
    ...generatePictorialBlocks(),
    ...generateHolidayBlocks(),
    ...generateArtDecoBlocks(),
    ...generateCelticBlocks(),
  ];
}
