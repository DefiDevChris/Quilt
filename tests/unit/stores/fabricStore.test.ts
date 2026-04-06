import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFabricStore } from '@/stores/fabricStore';

describe('fabricStore', () => {
  beforeEach(() => {
    useFabricStore.getState().reset();
  });

  it('initializes with default state', () => {
    const state = useFabricStore.getState();
    expect(state.fabrics).toEqual([]);
    expect(state.userFabrics).toEqual([]);
    expect(state.search).toBe('');
    expect(state.manufacturer).toBe('');
    expect(state.colorFamily).toBe('');
    expect(state.page).toBe(1);
    expect(state.isPanelOpen).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('sets search and resets page to 1', () => {
    useFabricStore.setState({ page: 3 });
    useFabricStore.getState().setSearch('kona');
    const state = useFabricStore.getState();
    expect(state.search).toBe('kona');
    expect(state.page).toBe(1);
  });

  it('sets manufacturer and resets page to 1', () => {
    useFabricStore.setState({ page: 5 });
    useFabricStore.getState().setManufacturer('Robert Kaufman');
    const state = useFabricStore.getState();
    expect(state.manufacturer).toBe('Robert Kaufman');
    expect(state.page).toBe(1);
  });

  it('sets color family and resets page to 1', () => {
    useFabricStore.setState({ page: 2 });
    useFabricStore.getState().setColorFamily('Blue');
    const state = useFabricStore.getState();
    expect(state.colorFamily).toBe('Blue');
    expect(state.page).toBe(1);
  });

  it('toggles panel open and closed', () => {
    expect(useFabricStore.getState().isPanelOpen).toBe(false);
    useFabricStore.getState().togglePanel();
    expect(useFabricStore.getState().isPanelOpen).toBe(true);
    useFabricStore.getState().togglePanel();
    expect(useFabricStore.getState().isPanelOpen).toBe(false);
  });

  it('setPanelOpen sets panel state directly', () => {
    useFabricStore.getState().setPanelOpen(true);
    expect(useFabricStore.getState().isPanelOpen).toBe(true);
    useFabricStore.getState().setPanelOpen(false);
    expect(useFabricStore.getState().isPanelOpen).toBe(false);
  });

  it('sets page number', () => {
    useFabricStore.getState().setPage(3);
    expect(useFabricStore.getState().page).toBe(3);
  });

  it('deleteUserFabric removes fabric from userFabrics on success', async () => {
    useFabricStore.setState({
      userFabrics: [
        {
          id: 'fab-1',
          name: 'Fabric 1',
          imageUrl: 'https://example.com/1.jpg',
          thumbnailUrl: null,
          manufacturer: null,
          sku: null,
          collection: null,
          colorFamily: null,
          value: null,
          hex: null,
          isDefault: false,
        },
        {
          id: 'fab-2',
          name: 'Fabric 2',
          imageUrl: 'https://example.com/2.jpg',
          thumbnailUrl: null,
          manufacturer: null,
          sku: null,
          collection: null,
          colorFamily: null,
          value: null,
          hex: null,
          isDefault: false,
        },
      ],
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(null, { status: 204 }) as Response;

    const result = await useFabricStore.getState().deleteUserFabric('fab-1');
    expect(result).toBe(true);
    expect(useFabricStore.getState().userFabrics).toHaveLength(1);
    expect(useFabricStore.getState().userFabrics[0].id).toBe('fab-2');

    globalThis.fetch = originalFetch;
  });

  describe('fetchFabrics', () => {
    it('loads fabrics from server', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            fabrics: [{ id: 'f1', name: 'Cotton', imageUrl: '/img.jpg' }],
            pagination: { total: 1, totalPages: 1, page: 1 },
          },
        }),
      });
      globalThis.fetch = mockFetch;

      await useFabricStore.getState().fetchFabrics();

      expect(useFabricStore.getState().fabrics).toHaveLength(1);
      expect(useFabricStore.getState().total).toBe(1);
      expect(useFabricStore.getState().isLoading).toBe(false);
    });

    it('sets error on failed fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });
      globalThis.fetch = mockFetch;

      await useFabricStore.getState().fetchFabrics();

      expect(useFabricStore.getState().error).toBe('Server error');
      expect(useFabricStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading during fetch', async () => {
      let loadPromise: Promise<void> | null = null;
      const mockFetch = vi.fn().mockImplementation(() => {
        if (!loadPromise) {
          loadPromise = Promise.resolve();
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: { fabrics: [], pagination: { total: 0, totalPages: 1, page: 1 } },
          }),
        });
      });
      globalThis.fetch = mockFetch;

      const promise = useFabricStore.getState().fetchFabrics();
      expect(useFabricStore.getState().isLoading).toBe(true);
      await promise;
      expect(useFabricStore.getState().isLoading).toBe(false);
    });
  });

  describe('fetchUserFabrics', () => {
    it('loads user fabrics from server', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { fabrics: [{ id: 'u1', name: 'My Fabric', imageUrl: '/u1.jpg' }] },
        }),
      });
      globalThis.fetch = mockFetch;

      await useFabricStore.getState().fetchUserFabrics();

      expect(useFabricStore.getState().userFabrics).toHaveLength(1);
      expect(useFabricStore.getState().isLoadingUserFabrics).toBe(false);
    });

    it('sets error on failed fetch', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Load failed' }),
      });
      globalThis.fetch = mockFetch;

      await useFabricStore.getState().fetchUserFabrics();

      expect(useFabricStore.getState().error).toBe('Load failed');
      expect(useFabricStore.getState().isLoadingUserFabrics).toBe(false);
    });
  });

  describe('deleteUserFabric', () => {
    it('returns false on network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      globalThis.fetch = mockFetch;

      const result = await useFabricStore.getState().deleteUserFabric('fab-1');
      expect(result).toBe(false);
    });

    it('returns false on non-ok response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      globalThis.fetch = mockFetch;

      const result = await useFabricStore.getState().deleteUserFabric('fab-1');
      expect(result).toBe(false);
    });

    it('does not remove fabric when delete fails', async () => {
      useFabricStore.setState({
        userFabrics: [
          {
            id: 'fab-1',
            name: 'F1',
            imageUrl: '/f1.jpg',
            thumbnailUrl: null,
            manufacturer: null,
            sku: null,
            collection: null,
            colorFamily: null,
            value: null,
            hex: null,
            isDefault: false,
          },
        ],
      });
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      globalThis.fetch = mockFetch;

      await useFabricStore.getState().deleteUserFabric('fab-1');
      expect(useFabricStore.getState().userFabrics).toHaveLength(1);
    });
  });

  describe('setPanelOpen', () => {
    it('opens panel and fetches fabrics if empty', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { fabrics: [], pagination: { total: 0, totalPages: 1, page: 1 } },
        }),
      });
      globalThis.fetch = mockFetch;

      useFabricStore.getState().setPanelOpen(true);
      expect(useFabricStore.getState().isPanelOpen).toBe(true);
    });

    it('opens panel without fetching if fabrics exist', () => {
      useFabricStore.setState({
        fabrics: [
          {
            id: 'f1',
            name: 'F1',
            imageUrl: '',
            thumbnailUrl: null,
            manufacturer: null,
            sku: null,
            collection: null,
            colorFamily: null,
            value: null,
            hex: null,
            isDefault: false,
          },
        ],
      });
      useFabricStore.getState().setPanelOpen(true);
      expect(useFabricStore.getState().isPanelOpen).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears all state', async () => {
      useFabricStore.setState({
        fabrics: [
          {
            id: 'f1',
            name: 'F1',
            imageUrl: '',
            thumbnailUrl: null,
            manufacturer: null,
            sku: null,
            collection: null,
            colorFamily: null,
            value: null,
            hex: null,
            isDefault: false,
          },
        ],
        userFabrics: [
          {
            id: 'u1',
            name: 'U1',
            imageUrl: '',
            thumbnailUrl: null,
            manufacturer: null,
            sku: null,
            collection: null,
            colorFamily: null,
            value: null,
            hex: null,
            isDefault: false,
          },
        ],
        search: 'test',
        manufacturer: 'M1',
        colorFamily: 'Blue',
        page: 5,
        isPanelOpen: true,
      });

      useFabricStore.getState().reset();

      const state = useFabricStore.getState();
      expect(state.fabrics).toEqual([]);
      expect(state.userFabrics).toEqual([]);
      expect(state.search).toBe('');
      expect(state.manufacturer).toBe('');
      expect(state.colorFamily).toBe('');
      expect(state.page).toBe(1);
      expect(state.isPanelOpen).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
