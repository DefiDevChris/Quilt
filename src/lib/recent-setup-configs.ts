/**
 * Recent Setup Configs — localStorage persistence for block/layout setup modals
 */

const BLOCK_KEY = 'qc_recent_block_configs';
const LAYOUT_KEY = 'qc_recent_layout_configs';
const MAX_RECENT = 3;

export interface RecentBlockConfig {
  readonly blockSize: number;
  readonly cellSize: number;
  readonly blockType: string;
  readonly timestamp: number;
}

export interface RecentLayoutConfig {
  readonly widthIn: number;
  readonly heightIn: number;
  readonly blockSize: number;
  readonly cellSize: number;
  readonly presetLabel: string | null;
  readonly timestamp: number;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getRecentBlockConfigs(): readonly RecentBlockConfig[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(BLOCK_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentBlockConfig(config: Omit<RecentBlockConfig, 'timestamp'>): void {
  if (!isBrowser()) return;
  try {
    const existing = getRecentBlockConfigs();
    const filtered = existing.filter(
      (c) => c.blockSize !== config.blockSize || c.cellSize !== config.cellSize
    );
    const entry: RecentBlockConfig = { ...config, timestamp: Date.now() };
    const updated = [entry, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(BLOCK_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function getRecentLayoutConfigs(): readonly RecentLayoutConfig[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveRecentLayoutConfig(config: Omit<RecentLayoutConfig, 'timestamp'>): void {
  if (!isBrowser()) return;
  try {
    const existing = getRecentLayoutConfigs();
    const filtered = existing.filter(
      (c) =>
        c.widthIn !== config.widthIn ||
        c.heightIn !== config.heightIn ||
        c.blockSize !== config.blockSize
    );
    const entry: RecentLayoutConfig = { ...config, timestamp: Date.now() };
    const updated = [entry, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors
  }
}

export function getCellSizeQualityLabel(divisions: number): string {
  if (divisions >= 12) return 'Fine';
  if (divisions >= 6) return 'Standard';
  if (divisions >= 4) return 'Moderate';
  if (divisions >= 3) return 'Coarse';
  return 'Very Coarse';
}
