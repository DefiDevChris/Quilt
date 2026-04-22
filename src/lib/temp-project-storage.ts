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

/**
 * Result of a temp-project save attempt. Callers MUST check `ok` and surface
 * a user-visible error when false (e.g., set saveStatus to 'error') — the
 * previous signature returned `void` and silently dropped QuotaExceededError,
 * causing free users to believe their work was saved when localStorage was full.
 */
export interface SaveTempProjectResult {
  ok: boolean;
  /** Set when the persist failed because the browser's storage quota is exhausted. */
  quotaExceeded?: boolean;
  error?: Error;
}

function isQuotaExceededError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  // Browsers differ: Chrome uses QuotaExceededError, Safari throws DOMException
  // with name NS_ERROR_DOM_QUOTA_REACHED or code 22. Handle all variants.
  const anyErr = err as Error & { code?: number };
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    anyErr.code === 22 ||
    anyErr.code === 1014
  );
}

export function saveTempProject(
  projectId: string,
  data: Omit<TempProjectData, 'projectId' | 'savedAt' | 'expiresAt'>
): SaveTempProjectResult {
  if (typeof window === 'undefined') return { ok: false };

  const now = Date.now();
  const tempData: TempProjectData = {
    projectId,
    ...data,
    savedAt: now,
    expiresAt: now + EXPIRY_HOURS * 60 * 60 * 1000, // 24hr buffer for refreshes
  };

  try {
    localStorage.setItem(getStorageKey(projectId), JSON.stringify(tempData));
    return { ok: true };
  } catch (err) {
    const quotaExceeded = isQuotaExceededError(err);
    const error = err instanceof Error ? err : new Error(String(err));
    // Surface the failure in the console so devs see it in production logs.
    // The caller is responsible for turning this into a user-visible error.
    console.error(
      `[tempProjectStorage] Failed to persist project ${projectId}${quotaExceeded ? ' (quota exceeded)' : ''}:`,
      error,
    );
    return { ok: false, quotaExceeded, error };
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
