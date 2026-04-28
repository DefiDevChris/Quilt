import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useMobileUploadStore } from '@/stores/mobileUploadStore';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

describe('mobileUploadStore', () => {
  beforeEach(() => {
    useMobileUploadStore.setState({
      uploads: [],
      isLoading: false,
      error: null,
    });
    mockFetch.mockClear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useMobileUploadStore.getState();
      expect(state.uploads).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      useMobileUploadStore.getState().setError('Test error');
      expect(useMobileUploadStore.getState().error).toBe('Test error');
      useMobileUploadStore.getState().setError(null);
      expect(useMobileUploadStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      const store = useMobileUploadStore.getState();
      store.setError('Test error');
      store.uploads.push({ id: 'test' } as any);
      store.reset();
      const state = useMobileUploadStore.getState();
      expect(state.uploads).toEqual([]);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchUploads', () => {
    it('should fetch uploads without status filter', async () => {
      const mockUploads = [
        { id: '1', status: 'pending', imageUrl: 'https://example.com/img1.jpg' },
        { id: '2', status: 'processing', imageUrl: 'https://example.com/img2.jpg' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { uploads: mockUploads } }),
      });

      await useMobileUploadStore.getState().fetchUploads();

      expect(mockFetch).toHaveBeenCalledWith('/api/mobile-uploads?limit=50');
      const state = useMobileUploadStore.getState();
      expect(state.uploads).toEqual(mockUploads);
      expect(state.isLoading).toBe(false);
    });

    it('should fetch uploads with status filter', async () => {
      const mockUploads = [{ id: '1', status: 'pending', imageUrl: 'https://example.com/img1.jpg' }];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { uploads: mockUploads } }),
      });

      await useMobileUploadStore.getState().fetchUploads('pending');

      expect(mockFetch).toHaveBeenCalledWith('/api/mobile-uploads?status=pending&limit=50');
      const state = useMobileUploadStore.getState();
      expect(state.uploads).toEqual(mockUploads);
    });

    it('should handle fetch error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await useMobileUploadStore.getState().fetchUploads();

      const state = useMobileUploadStore.getState();
      expect(state.error).toBe('Server error');
      expect(state.isLoading).toBe(false);
    });

    it('should handle malformed error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await useMobileUploadStore.getState().fetchUploads();

      const state = useMobileUploadStore.getState();
      expect(state.error).toBe('Server returned 500');
    });
  });

  describe('createUpload', () => {
    it('should create upload successfully', async () => {
      const mockUpload = {
        id: 'upload-1',
        imageUrl: 'https://example.com/img.jpg',
        originalFilename: 'test.jpg',
        status: 'pending' as const,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockUpload }),
      });

      const result = await useMobileUploadStore.getState().createUpload(
        'https://example.com/img.jpg',
        'test.jpg',
        1024
      );

      expect(result).toEqual(mockUpload);
      expect(mockFetch).toHaveBeenCalledWith('/api/mobile-uploads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: 'https://example.com/img.jpg',
          originalFilename: 'test.jpg',
          fileSizeBytes: 1024,
        }),
      });
      const state = useMobileUploadStore.getState();
      expect(state.uploads).toContainEqual(mockUpload);
    });

    it('should handle create error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid image' }),
      });

      const result = await useMobileUploadStore.getState().createUpload('https://example.com/img.jpg');

      expect(result).toBeNull();
      const state = useMobileUploadStore.getState();
      expect(state.error).toBe('Invalid image');
    });

    it.skip('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await useMobileUploadStore.getState().createUpload('https://example.com/img.jpg');

      expect(result).toBeNull();
      const state = useMobileUploadStore.getState();
      expect(state.error).toBe('Failed to create upload');
    });
  });

  describe('updateType', () => {
    it('should update upload type successfully', async () => {
      const existingUpload = { id: 'upload-1', status: 'pending', assignedType: null as any };
      useMobileUploadStore.setState({ uploads: [existingUpload as any] });

      const updatedUpload = { ...existingUpload, assignedType: 'fabric' as const };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: updatedUpload }),
      });

      await useMobileUploadStore.getState().updateType('upload-1', 'fabric');

      expect(mockFetch).toHaveBeenCalledWith('/api/mobile-uploads/upload-1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedType: 'fabric' }),
      });
      const state = useMobileUploadStore.getState();
      expect(state.uploads[0].assignedType).toBe('fabric');
    });

    it('should handle update error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await useMobileUploadStore.getState().updateType('upload-1', 'block');

      const state = useMobileUploadStore.getState();
      expect(state.error).toBe('Not found');
    });
  });

  describe('processUpload', () => {
    it('should process upload successfully', async () => {
      const existingUpload = { id: 'upload-1', status: 'pending', assignedType: null as any };
      useMobileUploadStore.setState({ uploads: [existingUpload as any] });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { redirectAction: '/fabrics' } }),
      });

      const result = await useMobileUploadStore.getState().processUpload('upload-1', 'fabric');

      expect(result).toEqual({ redirectAction: '/fabrics' });
      const state = useMobileUploadStore.getState();
      expect(state.uploads[0].status).toBe('processing');
      expect(state.uploads[0].assignedType).toBe('fabric');
    });

    it('should return null on process error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Processing failed' }),
      });

      const result = await useMobileUploadStore.getState().processUpload('upload-1', 'block');

      expect(result).toBeNull();
      const state = useMobileUploadStore.getState();
      expect(state.error).toBe('Processing failed');
    });
  });

  describe('completeUpload', () => {
    it('should complete upload and remove from list', async () => {
      const existingUpload = { id: 'upload-1', status: 'processing', assignedType: 'fabric' as const };
      useMobileUploadStore.setState({ uploads: [existingUpload as any] });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      });

      await useMobileUploadStore.getState().completeUpload('upload-1', 'entity-123', 'fabric');

      const state = useMobileUploadStore.getState();
      expect(state.uploads).toHaveLength(0);
    });

    it('should handle complete error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid entity' }),
      });

      await useMobileUploadStore.getState().completeUpload('upload-1', 'entity-123', 'fabric');

      const state = useMobileUploadStore.getState();
      expect(state.error).toBe('Invalid entity');
    });
  });

  describe('deleteUpload', () => {
    it('should delete upload successfully', async () => {
      const existingUpload = { id: 'upload-1', status: 'pending' };
      useMobileUploadStore.setState({ uploads: [existingUpload as any] });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await useMobileUploadStore.getState().deleteUpload('upload-1');

      expect(mockFetch).toHaveBeenCalledWith('/api/mobile-uploads/upload-1', {
        method: 'DELETE',
      });
      const state = useMobileUploadStore.getState();
      expect(state.uploads).toHaveLength(0);
    });

    it('should handle delete error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await useMobileUploadStore.getState().deleteUpload('upload-1');

      const state = useMobileUploadStore.getState();
      expect(state.error).toBe('Not found');
    });

    it('should handle malformed delete response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      });

      await useMobileUploadStore.getState().deleteUpload('upload-1');

      const state = useMobileUploadStore.getState();
      expect(state.error).toBe('Server returned 500');
    });
  });
});
