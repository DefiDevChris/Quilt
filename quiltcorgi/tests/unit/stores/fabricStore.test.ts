import { describe, it, expect, beforeEach } from 'vitest';
import { useFabricStore } from '@/stores/fabricStore';

function resetStore() {
  useFabricStore.setState({
    fabrics: [],
    userFabrics: [],
    search: '',
    manufacturer: '',
    colorFamily: '',
    page: 1,
    totalPages: 1,
    total: 0,
    isLoading: false,
    isLoadingUserFabrics: false,
    error: null,
    isPanelOpen: false,
  });
}

describe('fabricStore', () => {
  beforeEach(resetStore);

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
          isDefault: false,
        },
      ],
    });

    // Mock fetch to return 204
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(null, { status: 204 }) as Response;

    const result = await useFabricStore.getState().deleteUserFabric('fab-1');
    expect(result).toBe(true);
    expect(useFabricStore.getState().userFabrics).toHaveLength(1);
    expect(useFabricStore.getState().userFabrics[0].id).toBe('fab-2');

    globalThis.fetch = originalFetch;
  });
});
