const MANUFACTURER_PATTERNS: [RegExp, string][] = [
  [/\bModa\b/i, 'Moda'],
  [/\bFree Spirit\b/i, 'Free Spirit'],
  [/\bFreeSpirit\b/i, 'Free Spirit'],
  [/\bRiley Blake\b/i, 'Riley Blake'],
  [/\bRobert Kaufman\b/i, 'Robert Kaufman'],
  [/\bAndover\b/i, 'Andover'],
  [/\bArt Gallery\b/i, 'Art Gallery'],
  [/\bMichael Miller\b/i, 'Michael Miller'],
  [/\bBenartex\b/i, 'Benartex'],
  [/\bNorthcott\b/i, 'Northcott'],
  [/\bWindham\b/i, 'Windham Fabrics'],
  [/\bPaintbrush Studio\b/i, 'Paintbrush Studio'],
  [/\bRJR\b/i, 'RJR Fabrics'],
  [/\bClothworks\b/i, 'Clothworks'],
  [/\bConnecting Threads\b/i, 'Connecting Threads'],
  [/\bSpoonflower\b/i, 'Spoonflower'],
  [/\bTula Pink\b/i, 'Free Spirit'],
  [/\bKaffe Fassett\b/i, 'Free Spirit'],
  [/\bAnna Maria Horner\b/i, 'Free Spirit'],
];

export function extractManufacturer(name: string): string | null {
  for (const [pattern, manufacturer] of MANUFACTURER_PATTERNS) {
    if (pattern.test(name)) return manufacturer;
  }
  return null;
}

export function extractCollection(name: string, manufacturer: string | null): string | null {
  let remainder = name;

  if (manufacturer) {
    const pattern = new RegExp(manufacturer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    remainder = remainder.replace(pattern, '').trim();
  }

  const separators = /[\s]*[–—\-\:][\s]*/;
  const parts = remainder.split(separators).filter((p) => p.trim().length > 0);

  if (parts.length >= 2) {
    return parts[0].trim();
  }

  return null;
}
