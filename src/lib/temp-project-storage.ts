/**
 * Temporary project storage for free users.
 * Projects are stored in localStorage as a safety buffer during the session.
 * Data persists for 24 hours to handle page refreshes, but users are not informed
 * of this — the UX is "subscribe to save or lose your work on exit."
 */

const STORAGE_KEY_PREFIX = 'qc_temp_project_';
const EXPIRY_HOURS = 24;

export interface TempProjectData {
  projectId: string;
  canvasData: Record<string, unknown>;
  unitSystem: string;
  gridSettings: Record<string, unknown>;
  fabricPresets: Array<{ id: string; name: string; imageUrl: string }>;
  canvasWidth: number;
  canvasHeight: number;
  worktables: Array<Record<string, unknown>>;
  activeWorktable?: 'quilt' | 'block-builder';
  savedAt: number;
  expiresAt: number;
}

function getStorageKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

export function saveTempProject(
  projectId: string,
  data: Omit<TempProjectData, 'projectId' | 'savedAt' | 'expiresAt'>
): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const tempData: TempProjectData = {
    projectId,
    ...data,
    savedAt: now,
    expiresAt: now + EXPIRY_HOURS * 60 * 60 * 1000, // 24hr buffer for refreshes
  };

  try {
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(tempData));
  } catch {
    // Silently fail — temp storage is best-effort
  }
}

export function loadTempProject(projectId: string): TempProjectData | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    if (!raw) return null;

    const data = JSON.parse(raw) as TempProjectData;

    // Check if expired
    if (Date.now() > data.expiresAt) {
      localStorage.removeItem(getStorageKey(projectId));
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export function deleteTempProject(projectId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getStorageKey(projectId));
}

export function cleanupExpiredProjects(): void {
  if (typeof window === 'undefined') return;

  const now = Date.now();
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key?.startsWith(STORAGE_KEY_PREFIX)) continue;

    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const data = JSON.parse(raw) as TempProjectData;
      if (now > data.expiresAt) {
        keysToRemove.push(key);
      }
    } catch {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
