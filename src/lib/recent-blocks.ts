/**
 * Recent Blocks utilities
 * Handles persistence of recently used blocks in localStorage.
 */

const MAX_RECENT_BLOCKS = 12;
const STORAGE_KEY = 'qc-recent-blocks';

interface RecentBlock {
  readonly id: string;
  readonly timestamp: number;
}

function loadRecentBlocks(): RecentBlock[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentBlock[];
  } catch {
    return [];
  }
}

function saveRecentBlocks(blockId: string): RecentBlock[] {
  if (typeof window === 'undefined') return [];
  const recent = loadRecentBlocks().filter((b) => b.id !== blockId);
  const updated = [{ id: blockId, timestamp: Date.now() }, ...recent].slice(0, MAX_RECENT_BLOCKS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getRecentBlocks(): RecentBlock[] {
  return loadRecentBlocks();
}

export function addRecentBlock(blockId: string): RecentBlock[] {
  return saveRecentBlocks(blockId);
}
