/**
 * Generic localStorage persistence for recent items.
 * Eliminates duplicated load/filter/slice/save boilerplate across
 * recent-blocks.ts and recent-fabrics.ts.
 */

export function getRecentItems<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function saveRecentItem<T extends { id: string; timestamp: number }>(
  key: string,
  max: number,
  item: Omit<T, 'timestamp'>,
): T[] {
  if (typeof window === 'undefined') return [];
  const recent = getRecentItems<T>(key).filter((r: T) => (r as { id: string }).id !== item.id);
  const updated = [{ ...item, timestamp: Date.now() } as T, ...recent].slice(0, max);
  localStorage.setItem(key, JSON.stringify(updated));
  return updated;
}
