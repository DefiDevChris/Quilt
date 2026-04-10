/**
 * Recently-used block tracking — stored in localStorage.
 *
 * Tracks the last N block IDs the user has placed on the canvas,
 * so they appear as quick-access shortcuts in the Block Library.
 */

const STORAGE_KEY = 'qc_recently_used_blocks';
const MAX_RECENT = 8;

let _cache: string[] | null = null;

function getRecent(): string[] {
  if (_cache) return _cache;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    _cache = raw ? (JSON.parse(raw) as string[]) : [];
    return _cache;
  } catch {
    return [];
  }
}

function setRecent(recent: string[]) {
  _cache = recent;
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    }
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

/**
 * Record that a block was used (dragged onto canvas).
 * Adds to front of recent list, deduplicates, trims to MAX_RECENT.
 */
export function recordBlockUsed(blockId: string): void {
  const recent = getRecent().filter((id) => id !== blockId);
  recent.unshift(blockId);
  setRecent(recent.slice(0, MAX_RECENT));
}

/**
 * Get the list of recently used block IDs.
 */
export function getRecentlyUsedBlocks(): string[] {
  return getRecent();
}

/**
 * Clear the recently used list.
 */
export function clearRecentlyUsedBlocks(): void {
  setRecent([]);
}
