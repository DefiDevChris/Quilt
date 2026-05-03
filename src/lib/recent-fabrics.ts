/**
 * Recent Fabrics utilities
 * Thin wrapper over generic recent-items persistence.
 */

import { getRecentItems, saveRecentItem } from './recent-items';

const MAX_RECENT_FABRICS = 6;
const STORAGE_KEY = 'qc_recent_fabrics';

export interface RecentFabric {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string;
  readonly timestamp: number;
}

export function getRecentFabrics(): RecentFabric[] {
  return getRecentItems<RecentFabric>(STORAGE_KEY);
}

export function saveRecentFabric(fabric: Omit<RecentFabric, 'timestamp'>): RecentFabric[] {
  return saveRecentItem<RecentFabric>(STORAGE_KEY, MAX_RECENT_FABRICS, fabric);
}
