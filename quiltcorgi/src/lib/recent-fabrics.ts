/**
 * Recent Fabrics utilities
 * Handles persistence of recently used fabrics in localStorage.
 */

export interface RecentFabric {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly timestamp: number;
}

const MAX_RECENT_FABRICS = 6;
const STORAGE_KEY = 'qc_recent_fabrics';

function loadRecentFabrics(): RecentFabric[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentFabric[];
  } catch {
    return [];
  }
}

export function saveRecentFabric(fabric: Omit<RecentFabric, 'timestamp'>): RecentFabric[] {
  if (typeof window === 'undefined') return [];
  const recent = loadRecentFabrics().filter((f) => f.id !== fabric.id);
  const updated = [{ ...fabric, timestamp: Date.now() }, ...recent].slice(0, MAX_RECENT_FABRICS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function getRecentFabrics(): RecentFabric[] {
  return loadRecentFabrics();
}
