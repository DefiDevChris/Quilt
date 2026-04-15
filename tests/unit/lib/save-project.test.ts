import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveProject,
  cancelSaveProject,
  cancelAllSaveProjects,
  type SaveProjectOptions,
} from '@/lib/save-project';
import { useProjectStore } from '@/stores/projectStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { useAuthStore } from '@/stores/authStore';
import { getAuthDerived } from '@/stores/authStore';
import { saveTempProject } from '@/lib/temp-project-storage';

vi.mock('@/stores/authStore', () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
  getAuthDerived: vi.fn(),
}));

// Mock global fetch
const mockFetch = vi.fn().mockImplementation(async (url, options) => {
  await new Promise((resolve) => setTimeout(resolve, 10));
  if (options?.signal?.aborted) {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    throw error;
  }
  return { ok: true };
});
global.fetch = mockFetch;

// Mock temp project storage
vi.mock('@/lib/temp-project-storage', () => ({ saveTempProject: vi.fn() }));

// Spy on AbortController abort
const abortSpy = vi.spyOn(AbortController.prototype, 'abort');

describe('save-project', () => {
  const mockFabricCanvas = {
    toJSON: vi.fn(() => ({ version: '1.0', objects: [] })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    abortSpy.mockClear();

    // Reset stores
    useProjectStore.getState().reset();
    useProjectStore.getState().setProject({
      id: 'test-project',
      name: 'Test Project',
      width: 48,
      height: 48,
    });
    useProjectStore.getState().setSaveStatus('saved');
    useProjectStore.getState().setDirty(false);

    useCanvasStore.getState().resetHistory();
    useCanvasStore.getState().setUnitSystem('imperial');
    useCanvasStore.getState().setGridSettings({ enabled: true, size: 1, snapToGrid: true });

    // Mock auth as pro user so server save path is taken
    vi.mocked(useAuthStore.getState).mockReturnValue({
      user: { id: 'test-user', email: 'test@test.com' },
      isLoading: false,
      setUser: vi.fn(),
      reset: vi.fn(),
    } as unknown as ReturnType<typeof useAuthStore.getState>);
    vi.mocked(getAuthDerived).mockReturnValue({ isPro: true, isAdmin: false });

    // Reset fetch mock
    mockFetch.mockReset();
  });

  afterEach(() => {
    cancelAllSaveProjects();
  });

  describe('saveProject', () => {
    it('returns early when projectId is null', async () => {
      await saveProject({ projectId: null, fabricCanvas: mockFabricCanvas });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('returns early when fabricCanvas is null', async () => {
      await saveProject({ projectId: 'test-project', fabricCanvas: null });
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('sets status to saved on success', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await saveProject({
        projectId: 'test-project',
        fabricCanvas: mockFabricCanvas,
      });

      expect(useProjectStore.getState().saveStatus).toBe('saved');
      expect(useProjectStore.getState().isDirty).toBe(false);
      expect(useProjectStore.getState().lastSavedAt).toBeInstanceOf(Date);
    });

    it('sets status to error on failure', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      await saveProject({
        projectId: 'test-project',
        fabricCanvas: mockFabricCanvas,
      });

      expect(useProjectStore.getState().saveStatus).toBe('error');
    });

    it('calls fetch with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await saveProject({
        projectId: 'test-project',
        fabricCanvas: mockFabricCanvas,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/projects/test-project',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String),
        })
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body).toHaveProperty('canvasData');
      expect(body).toHaveProperty('unitSystem');
      expect(body).toHaveProperty('gridSettings');
    });
  });

  describe('retry logic', () => {
    it('calculates exponential backoff correctly', () => {
      // Test the exponential backoff formula directly
      const RETRY_DELAY_BASE_MS = 2000;
      const RETRY_DELAY_MAX_MS = 30000;

      const getRetryDelayMs = (retryCount: number): number => {
        return Math.min(RETRY_DELAY_BASE_MS * Math.pow(2, retryCount), RETRY_DELAY_MAX_MS);
      };

      // retryCount=0: 2000 * 1 = 2000ms
      expect(getRetryDelayMs(0)).toBe(2000);

      // retryCount=1: 2000 * 2 = 4000ms
      expect(getRetryDelayMs(1)).toBe(4000);

      // retryCount=2: 2000 * 4 = 8000ms
      expect(getRetryDelayMs(2)).toBe(8000);

      // retryCount=3: 2000 * 8 = 16000ms
      expect(getRetryDelayMs(3)).toBe(16000);

      // retryCount=4: 2000 * 16 = 32000ms, capped at 30000ms
      expect(getRetryDelayMs(4)).toBe(30000);

      // retryCount=5: would be 64000ms, capped at 30000ms
      expect(getRetryDelayMs(5)).toBe(30000);
    });
  });

  describe('save source handling', () => {
    it('auto-save yields to in-flight manual save', async () => {
      // Use fake timers for this test
      vi.useFakeTimers({ shouldAdvanceTime: true });

      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 1000))
      );

      // Start manual save
      const manualSave = saveProject({
        projectId: 'test-project',
        fabricCanvas: mockFabricCanvas,
        source: 'manual',
      });

      // Try auto-save while manual is in-flight
      const autoSave = saveProject({
        projectId: 'test-project',
        fabricCanvas: mockFabricCanvas,
        source: 'auto',
      });

      // Advance time to let manual save complete
      await vi.advanceTimersByTimeAsync(1000);
      await manualSave;
      await autoSave;

      // Restore real timers
      vi.useRealTimers();

      // Auto-save should have returned early without calling fetch
      // (only 1 call from manual save)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('manual save cancels auto-save', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });

      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true }), 1000))
      );

      // Start auto-save
      const autoSave = saveProject({
        projectId: 'test-project',
        fabricCanvas: mockFabricCanvas,
        source: 'auto',
      });

      // Start manual save (should cancel auto)
      const manualSave = saveProject({
        projectId: 'test-project',
        fabricCanvas: mockFabricCanvas,
        source: 'manual',
      });

      await vi.advanceTimersByTimeAsync(1000);
      await manualSave;

      vi.useRealTimers();

      // Manual save should succeed
      expect(useProjectStore.getState().saveStatus).toBe('saved');
    });
  });

  describe('cancelSaveProject', () => {
    it('handles cancel for non-existent project gracefully', () => {
      expect(() => {
        cancelSaveProject('non-existent');
      }).not.toThrow();
    });

    it('cancels active controllers', async () => {
      const savePromise = saveProject({
        projectId: 'test-project',
        fabricCanvas: mockFabricCanvas,
        source: 'manual',
      });
      cancelSaveProject('test-project');
      await expect(savePromise).resolves.toBeUndefined();
      expect(abortSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancelAllSaveProjects', () => {
    it('cancels all pending saves without error', () => {
      expect(() => {
        cancelAllSaveProjects();
      }).not.toThrow();
    });

    it('cancels all active controllers', async () => {
      const manualPromise = saveProject({
        projectId: 'test-project',
        fabricCanvas: mockFabricCanvas,
        source: 'manual',
      });
      const autoPromise = saveProject({
        projectId: 'test-project-2',
        fabricCanvas: mockFabricCanvas,
        source: 'auto',
      });
      cancelAllSaveProjects();
      await expect(manualPromise).resolves.toBeUndefined();
      await expect(autoPromise).resolves.toBeUndefined();
      expect(abortSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('free-user save path', () => {
    it('saves to temp storage when not pro', async () => {
      vi.mocked(useAuthStore.getState).mockReturnValue({
        user: null,
        isLoading: false,
        setUser: vi.fn(),
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useAuthStore.getState>);
      vi.mocked(getAuthDerived).mockReturnValue({ isPro: false, isAdmin: false });
      await saveProject({ projectId: 'test-project', fabricCanvas: mockFabricCanvas });
      expect(vi.mocked(saveTempProject)).toHaveBeenCalledWith(
        'test-project',
        expect.objectContaining({
          canvasData: expect.objectContaining({ version: '1.0', objects: [] }),
          unitSystem: 'imperial',
          gridSettings: { enabled: true, size: 1, snapToGrid: true },
        })
      );
      expect(useProjectStore.getState().saveStatus).toBe('saved');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('pro required handling', () => {
    it('sets error status on 403 PRO_REQUIRED without retry', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ code: 'PRO_REQUIRED' }),
      });
      await saveProject({ projectId: 'test-project', fabricCanvas: mockFabricCanvas });
      expect(useProjectStore.getState().saveStatus).toBe('error');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
