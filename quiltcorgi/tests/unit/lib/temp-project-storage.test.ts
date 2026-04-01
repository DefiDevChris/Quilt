import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveTempProject,
  loadTempProject,
  deleteTempProject,
  cleanupExpiredProjects,
} from '@/lib/temp-project-storage';

const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  key: vi.fn(),
  length: 0,
  clear: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(globalThis, 'window', {
  value: {},
  writable: true,
});

describe('temp-project-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.length = 0;
  });

  describe('saveTempProject', () => {
    it('saves project to localStorage', () => {
      const data = {
        canvasData: { blocks: [] },
        unitSystem: 'imperial',
        gridSettings: {},
        fabricPresets: [],
        canvasWidth: 100,
        canvasHeight: 100,
      };
      saveTempProject('project-1', data);
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'qc_temp_project_project-1',
        expect.stringContaining('projectId')
      );
    });

    it('does nothing when window undefined', () => {
      Object.defineProperty(globalThis, 'window', { value: undefined });
      saveTempProject('p1', { canvasData: {}, unitSystem: 'imperial', gridSettings: {}, fabricPresets: [], canvasWidth: 100, canvasHeight: 100 });
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
      Object.defineProperty(globalThis, 'window', { value: {} });
    });

    it('fails silently on localStorage error', () => {
      mockLocalStorage.setItem.mockImplementationOnce(() => { throw new Error('Storage full'); });
      const data = { canvasData: {}, unitSystem: 'imperial', gridSettings: {}, fabricPresets: [], canvasWidth: 100, canvasHeight: 100 };
      expect(() => saveTempProject('p1', data)).not.toThrow();
    });
  });

  describe('loadTempProject', () => {
    it('returns null when not found', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      expect(loadTempProject('nonexistent')).toBeNull();
    });

    it('returns null and removes when expired', () => {
      const expiredData = { projectId: 'p1', savedAt: 0, expiresAt: Date.now() - 1000, canvasData: {}, unitSystem: 'imperial', gridSettings: {}, fabricPresets: [], canvasWidth: 100, canvasHeight: 100 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData));
      expect(loadTempProject('p1')).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('returns null on JSON parse error', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid json');
      expect(loadTempProject('p1')).toBeNull();
    });

    it('returns data when valid and not expired', () => {
      const validData = { projectId: 'p1', savedAt: Date.now(), expiresAt: Date.now() + 86400000, canvasData: {}, unitSystem: 'imperial', gridSettings: {}, fabricPresets: [], canvasWidth: 100, canvasHeight: 100 };
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(validData));
      const result = loadTempProject('p1');
      expect(result?.projectId).toBe('p1');
    });

    it('returns null when window undefined', () => {
      Object.defineProperty(globalThis, 'window', { value: undefined });
      expect(loadTempProject('p1')).toBeNull();
      Object.defineProperty(globalThis, 'window', { value: {} });
    });
  });

  describe('deleteTempProject', () => {
    it('removes project from localStorage', () => {
      deleteTempProject('p1');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('qc_temp_project_p1');
    });
  });

  describe('cleanupExpiredProjects', () => {
    it('removes expired projects', () => {
      const expiredData = { projectId: 'p1', expiresAt: Date.now() - 1000 };
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockReturnValue('qc_temp_project_p1');
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(expiredData));
      cleanupExpiredProjects();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('qc_temp_project_p1');
    });

    it('skips non-temp keys', () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockReturnValue('other_key');
      cleanupExpiredProjects();
      expect(mockLocalStorage.getItem).not.toHaveBeenCalled();
    });

    it('removes corrupted entries', () => {
      mockLocalStorage.length = 1;
      mockLocalStorage.key.mockReturnValue('qc_temp_project_bad');
      mockLocalStorage.getItem.mockReturnValue('not valid json');
      cleanupExpiredProjects();
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('qc_temp_project_bad');
    });
  });
});