/**
 * Recent Blocks utilities
 * Thin wrapper over generic recent-items persistence.
 */

import { getRecentItems, saveRecentItem } from './recent-items';

const MAX_RECENT_BLOCKS = 12;
const STORAGE_KEY = 'qc-recent-blocks';

export interface RecentBlock {
  readonly id: string;
  readonly timestamp: number;
}

export function getRecentBlocks(): RecentBlock[] {
  return getRecentItems<RecentBlock>(STORAGE_KEY);
}

export function addRecentBlock(blockId: string): RecentBlock[] {
  return saveRecentItem<RecentBlock>(STORAGE_KEY, MAX_RECENT_BLOCKS, { id: blockId });
}
