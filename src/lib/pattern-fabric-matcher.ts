/**
 * Pattern Fabric Matcher Engine
 *
 * Matches parsed pattern fabrics to database fabric records using a
 * tiered strategy: exact SKU match > fuzzy name match > color family heuristic.
 *
 * Pure computation — no React, Fabric.js, DOM, or DB dependencies.
 */

import type { ParsedFabric } from './pattern-parser-types';
import { normalizeString } from './string-utils';

// ── Types ──────────────────────────────────────────────────────────

export interface FabricRecord {
  readonly id: string;
  readonly name: string;
  readonly manufacturer: string | null;
  readonly sku: string | null;
  readonly collection: string | null;
  readonly colorFamily: string | null;
}

export interface FabricMatch {
  readonly patternLabel: string;
  readonly patternName: string;
  readonly patternSku: string | null;
  readonly matchedFabricId: string | null;
  readonly confidence: number;
  readonly colorHex: string;
  readonly matchMethod: 'sku' | 'name' | 'color-family' | 'none';
}

// ── Color Map ──────────────────────────────────────────────────────

const COLOR_NAME_TO_HEX: Readonly<Record<string, string>> = {
  white: '#ffffff',
  ivory: '#fffff0',
  cream: '#fffdd0',
  butter: '#ffef82',
  gold: '#ffd700',
  saffron: '#f4c430',
  orange: '#ff8c00',
  tomato: '#ff6347',
  red: '#cc0000',
  crimson: '#dc143c',
  ruby: '#9b111e',
  wine: '#722f37',
  pink: '#ffc0cb',
  'hot pink': '#ff69b4',
  magenta: '#ff00ff',
  berry: '#8e4585',
  lilac: '#c8a2c8',
  lavender: '#b57edc',
  purple: '#800080',
  amethyst: '#9966cc',
  navy: '#000080',
  'royal blue': '#4169e1',
  'sky blue': '#87ceeb',
  aqua: '#00ced1',
  teal: '#008080',
  seafoam: '#93e9be',
  sage: '#bcb88a',
  olive: '#808000',
  'forest green': '#228b22',
  emerald: '#50c878',
  lime: '#32cd32',
  moss: '#8a9a5b',
  tan: '#d2b48c',
  caramel: '#a0785a',
  chocolate: '#7b3f00',
  espresso: '#3c2218',
  charcoal: '#36454f',
  slate: '#708090',
  pewter: '#8e9196',
  silver: '#c0c0c0',
  black: '#000000',
};

const COLOR_FAMILY_TO_HEX: Readonly<Record<string, string>> = {
  white: '#ffffff',
  neutral: '#f5f0e6',
  yellow: '#ffd700',
  orange: '#ff8c00',
  red: '#cc0000',
  pink: '#ff69b4',
  purple: '#800080',
  blue: '#4169e1',
  green: '#228b22',
  brown: '#8b4513',
  grey: '#888888',
  gray: '#888888',
  black: '#000000',
};

const DEFAULT_HEX = '#888888';

// ── Levenshtein Distance ───────────────────────────────────────────

/**
 * Compute the Levenshtein edit distance between two strings.
 * Uses a single-row DP approach for O(min(m,n)) space.
 */
export function levenshteinDistance(a: string, b: string): number {
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  // Ensure b is the shorter string for space efficiency
  if (aLen < bLen) {
    return levenshteinDistance(b, a);
  }

  const row = new Array<number>(bLen + 1);
  for (let j = 0; j <= bLen; j++) {
    row[j] = j;
  }

  for (let i = 1; i <= aLen; i++) {
    let prev = row[0];
    row[0] = i;

    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const temp = row[j];
      row[j] = Math.min(
        row[j] + 1, // deletion
        row[j - 1] + 1, // insertion
        prev + cost // substitution
      );
      prev = temp;
    }
  }

  return row[bLen];
}

// ── Color Inference ────────────────────────────────────────────────

/**
 * Map a fabric name (and optional color family) to a hex color value.
 *
 * Strategy:
 * 1. Check each known color name against the fabric name (longest match first)
 * 2. Fall back to color family representative hex
 * 3. Default to mid-grey (#888888)
 */
export function inferColorHex(fabricName: string, colorFamily?: string): string {
  const nameLower = fabricName.toLowerCase();

  // Try longest color names first to prefer "hot pink" over "pink",
  // "royal blue" over "blue", etc.
  const sortedNames = Object.keys(COLOR_NAME_TO_HEX).sort((a, b) => b.length - a.length);

  for (const colorName of sortedNames) {
    if (nameLower.includes(colorName)) {
      return COLOR_NAME_TO_HEX[colorName];
    }
  }

  if (colorFamily) {
    const familyLower = colorFamily.toLowerCase();
    const familyHex = COLOR_FAMILY_TO_HEX[familyLower];
    if (familyHex) {
      return familyHex;
    }
  }

  return DEFAULT_HEX;
}

// ── Internal Helpers ───────────────────────────────────────────────

/**
 * Normalize a SKU string for comparison: uppercase, strip whitespace and dashes.
 */
function normalizeSku(sku: string): string {
  return sku.replace(/[\s\-]/g, '').toUpperCase();
}

/**
 * Normalize a name for fuzzy comparison: lowercase, trim, collapse whitespace.
 */
function normalizeName(name: string): string {
  return normalizeString(name);
}

/**
 * Extract a plausible color family from a fabric name by checking for
 * known color keywords. Returns the first match or undefined.
 */
function inferColorFamily(fabricName: string): string | undefined {
  const nameLower = fabricName.toLowerCase();

  // Check specific color names, map to family
  const colorToFamily: ReadonlyArray<readonly [string, string]> = [
    ['white', 'White'],
    ['ivory', 'Neutral'],
    ['cream', 'Neutral'],
    ['butter', 'Yellow'],
    ['gold', 'Yellow'],
    ['saffron', 'Orange'],
    ['orange', 'Orange'],
    ['tomato', 'Red'],
    ['red', 'Red'],
    ['crimson', 'Red'],
    ['ruby', 'Red'],
    ['wine', 'Red'],
    ['pink', 'Pink'],
    ['magenta', 'Pink'],
    ['berry', 'Pink'],
    ['lilac', 'Purple'],
    ['lavender', 'Purple'],
    ['purple', 'Purple'],
    ['amethyst', 'Purple'],
    ['navy', 'Blue'],
    ['blue', 'Blue'],
    ['aqua', 'Blue'],
    ['teal', 'Blue'],
    ['seafoam', 'Green'],
    ['sage', 'Green'],
    ['olive', 'Green'],
    ['green', 'Green'],
    ['emerald', 'Green'],
    ['lime', 'Green'],
    ['moss', 'Green'],
    ['tan', 'Brown'],
    ['caramel', 'Brown'],
    ['chocolate', 'Brown'],
    ['espresso', 'Brown'],
    ['charcoal', 'Grey'],
    ['slate', 'Grey'],
    ['pewter', 'Grey'],
    ['silver', 'Grey'],
    ['black', 'Black'],
  ];

  for (const [keyword, family] of colorToFamily) {
    if (nameLower.includes(keyword)) {
      return family;
    }
  }

  return undefined;
}

// ── SKU Index ──────────────────────────────────────────────────────

/**
 * Build a lookup map of normalized SKU -> FabricRecord for O(1) SKU matching.
 */
function buildSkuIndex(dbFabrics: readonly FabricRecord[]): ReadonlyMap<string, FabricRecord> {
  const index = new Map<string, FabricRecord>();
  for (const fabric of dbFabrics) {
    if (fabric.sku) {
      index.set(normalizeSku(fabric.sku), fabric);
    }
  }
  return index;
}

// ── Match Strategies ───────────────────────────────────────────────

function trySkuMatch(
  patternFabric: ParsedFabric,
  skuIndex: ReadonlyMap<string, FabricRecord>
): FabricRecord | null {
  if (!patternFabric.sku) return null;

  const normalized = normalizeSku(patternFabric.sku);
  return skuIndex.get(normalized) ?? null;
}

function tryNameMatch(
  patternFabric: ParsedFabric,
  dbFabrics: readonly FabricRecord[]
): { readonly fabric: FabricRecord; readonly distance: number } | null {
  const patternName = normalizeName(patternFabric.name);
  let bestMatch: FabricRecord | null = null;
  let bestDistance = Infinity;

  for (const dbFabric of dbFabrics) {
    const dbName = normalizeName(dbFabric.name);

    // Try collection + color name if collection exists
    if (dbFabric.collection) {
      const collectionName = normalizeName(`${dbFabric.collection} ${dbFabric.name}`);
      const dist = levenshteinDistance(patternName, collectionName);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestMatch = dbFabric;
      }
    }

    // Try plain name match
    const dist = levenshteinDistance(patternName, dbName);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestMatch = dbFabric;
    }
  }

  if (bestMatch && bestDistance <= 3) {
    return { fabric: bestMatch, distance: bestDistance };
  }

  return null;
}

function tryColorFamilyMatch(
  patternFabric: ParsedFabric,
  dbFabrics: readonly FabricRecord[]
): FabricRecord | null {
  const targetFamily = patternFabric.colorFamily ?? inferColorFamily(patternFabric.name);

  if (!targetFamily) return null;

  const targetFamilyLower = targetFamily.toLowerCase();

  for (const dbFabric of dbFabrics) {
    if (dbFabric.colorFamily && dbFabric.colorFamily.toLowerCase() === targetFamilyLower) {
      return dbFabric;
    }
  }

  return null;
}

// ── Main Matcher ───────────────────────────────────────────────────

/**
 * Match an array of parsed pattern fabrics to database fabric records.
 *
 * For each pattern fabric, tries three strategies in order:
 * 1. Exact SKU match (normalized — stripped whitespace, uppercased)
 * 2. Fuzzy name match (Levenshtein distance <= 3, considering collection + name)
 * 3. Color family match (from explicit colorFamily or inferred from name)
 *
 * Returns a FabricMatch for every input fabric, with confidence and method.
 */
export function matchPatternFabrics(
  patternFabrics: readonly ParsedFabric[],
  dbFabrics: readonly FabricRecord[]
): FabricMatch[] {
  const skuIndex = buildSkuIndex(dbFabrics);

  return patternFabrics.map((patternFabric): FabricMatch => {
    // Strategy 1: Exact SKU match
    const skuMatch = trySkuMatch(patternFabric, skuIndex);
    if (skuMatch) {
      return {
        patternLabel: patternFabric.label,
        patternName: patternFabric.name,
        patternSku: patternFabric.sku ?? null,
        matchedFabricId: skuMatch.id,
        confidence: 1.0,
        colorHex: inferColorHex(skuMatch.name, skuMatch.colorFamily ?? undefined),
        matchMethod: 'sku',
      };
    }

    // Strategy 2: Fuzzy name match
    const nameMatch = tryNameMatch(patternFabric, dbFabrics);
    if (nameMatch) {
      // Confidence decreases with edit distance: 0 -> 0.9, 1 -> 0.8, 2 -> 0.7, 3 -> 0.6
      const confidence = 0.9 - nameMatch.distance * 0.1;
      return {
        patternLabel: patternFabric.label,
        patternName: patternFabric.name,
        patternSku: patternFabric.sku ?? null,
        matchedFabricId: nameMatch.fabric.id,
        confidence,
        colorHex: inferColorHex(nameMatch.fabric.name, nameMatch.fabric.colorFamily ?? undefined),
        matchMethod: 'name',
      };
    }

    // Strategy 3: Color family match
    const colorMatch = tryColorFamilyMatch(patternFabric, dbFabrics);
    if (colorMatch) {
      return {
        patternLabel: patternFabric.label,
        patternName: patternFabric.name,
        patternSku: patternFabric.sku ?? null,
        matchedFabricId: colorMatch.id,
        confidence: 0.4,
        colorHex: inferColorHex(colorMatch.name, colorMatch.colorFamily ?? undefined),
        matchMethod: 'color-family',
      };
    }

    // No match found
    return {
      patternLabel: patternFabric.label,
      patternName: patternFabric.name,
      patternSku: patternFabric.sku ?? null,
      matchedFabricId: null,
      confidence: 0,
      colorHex: inferColorHex(patternFabric.name, patternFabric.colorFamily ?? undefined),
      matchMethod: 'none',
    };
  });
}
