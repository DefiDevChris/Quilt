/**
 * Fabric Library Definitions
 *
 * Loads 2,764 solid fabric swatches from 16 manufacturers via the QuiltySolid
 * open-source dataset (MIT license). Source: quiltysolid.com/fabricSwatches.json
 *
 * Excludes thread lines (DMC, Glide, Aurifil, WonderFil) and Pantone reference colors.
 */

import swatchData from './fabricSwatches.json';

export interface FabricDefinition {
  name: string;
  manufacturer: string;
  hex: string;
  collection: string;
  colorFamily: string;
  value: 'Light' | 'Medium' | 'Dark';
}

/** JSON key -> included in fabric library (excludes threads + Pantone) */
const FABRIC_KEYS = [
  'kona',
  'modaBella',
  'rileyBlake',
  'artGallery',
  'paintBrushStudio',
  'rjrCottonSupreme',
  'michaelMiller',
  'northcott',
  'devonstone',
  'freeSpirit',
  'benartexSuperior',
  'andoverCenturySolids',
  'americanMade',
  'rubyBee',
  'spoonflower',
  'tilda',
] as const;

/**
 * Derive color family from HSL values.
 * Maps hue/saturation/lightness to quilting-relevant color families.
 */
function hslToColorFamily(hsl: [number, number, number, number]): string {
  const [h, s, l] = hsl;

  if (l >= 0.95) return 'White';
  if (l <= 0.08) return 'Black';
  if (s <= 0.1) {
    if (l > 0.7) return 'White';
    if (l > 0.3) return 'Gray';
    return 'Black';
  }

  // Desaturated warm tones -> Neutral/Brown
  if (s <= 0.25 && l > 0.6) return 'Neutral';

  const hue = h;
  if (hue <= 15 || hue > 345) return 'Red';
  if (hue <= 40) {
    if (l > 0.7) return 'Neutral';
    return s > 0.5 ? 'Orange' : 'Brown';
  }
  if (hue <= 65) return 'Yellow';
  if (hue <= 165) return 'Green';
  if (hue <= 255) return 'Blue';
  if (hue <= 290) return 'Purple';
  if (hue <= 345) return 'Pink';

  return 'Neutral';
}

/**
 * Derive quilting value (Light/Medium/Dark) from HSL lightness.
 * Quilters classify fabrics by value for contrast in their designs.
 */
function hslToValue(hsl: [number, number, number, number]): 'Light' | 'Medium' | 'Dark' {
  const l = hsl[2];
  if (l >= 0.65) return 'Light';
  if (l >= 0.35) return 'Medium';
  return 'Dark';
}

export function getAllFabricDefinitions(): FabricDefinition[] {
  const definitions: FabricDefinition[] = [];

  for (const key of FABRIC_KEYS) {
    const entry = (swatchData as Record<string, unknown>)[key] as
      | {
          brand: string;
          line: string;
          swatches: Array<{ label: string; hex: string; hsl: [number, number, number, number] }>;
        }
      | undefined;

    if (!entry) continue;

    const brand = entry.brand || entry.line;
    const line = entry.line;

    for (const swatch of entry.swatches) {
      definitions.push({
        name: `${line} - ${swatch.label}`,
        manufacturer: brand,
        hex: swatch.hex,
        collection: line,
        colorFamily: hslToColorFamily(swatch.hsl),
        value: hslToValue(swatch.hsl),
      });
    }
  }

  return definitions;
}
