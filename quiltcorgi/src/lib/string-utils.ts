/**
 * String Utilities
 * Canonical string normalization functions.
 * Pure functions — no dependencies.
 */

/**
 * Normalize a string: lowercase, trim, collapse whitespace.
 * Used for fuzzy matching across the codebase.
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Normalize a block name for matching.
 * Strips trailing "quilt"/"block"/"unit" suffixes.
 */
export function normalizeBlockName(name: string): string {
  return normalizeString(name).replace(/\b(quilt|block|unit)$/, '').trim();
}
