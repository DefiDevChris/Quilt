/**
 * Deduplication Utilities
 *
 * Generic deduplication by string key with auto-labeling (A, B, C, ...).
 * Shared between cutlist-pdf-engine.ts and project-pdf-engine.ts.
 *
 * Pure functions — no React, Fabric.js, or DOM dependencies.
 */

/**
 * Deduplicate items by a string key, aggregating counts and assigning labels.
 *
 * @param items   Array of items to deduplicate
 * @param keyFn   Function to extract the deduplication key from each item
 * @param countFn Function to extract the initial count from each item (default: 1)
 * @returns Array of unique items with aggregated counts and alphabetical labels
 */
export function deduplicateBy<T>(
  items: readonly T[],
  keyFn: (item: T) => string,
  countFn: (item: T) => number = () => 1
): Array<{ item: T; count: number; label: string }> {
  const map = new Map<string, { item: T; count: number }>();

  for (const item of items) {
    const key = keyFn(item).trim();
    if (!key) continue;

    const count = countFn(item);
    const existing = map.get(key);
    if (existing) {
      map.set(key, { ...existing, count: existing.count + count });
    } else {
      map.set(key, { item, count });
    }
  }

  let labelIdx = 0;
  return Array.from(map.values()).map(({ item, count }) => ({
    item,
    count,
    label: String.fromCharCode(65 + (labelIdx++ % 26)),
  }));
}
