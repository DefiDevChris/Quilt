import { describe, it, expect, beforeEach } from 'vitest';
import { useBlockStore } from '@/stores/blockStore';

describe('blockStore', () => {
  beforeEach(() => {
    useBlockStore.setState({
      blocks: [],
      userBlocks: [],
      search: '',
      category: '',
      page: 1,
      totalPages: 1,
      total: 0,
      isLoading: false,
      isLoadingUserBlocks: false,
      error: null,
      isPanelOpen: false,
    });
  });

  it('initializes with default state', () => {
    const state = useBlockStore.getState();
    expect(state.blocks).toEqual([]);
    expect(state.search).toBe('');
    expect(state.category).toBe('');
    expect(state.page).toBe(1);
    expect(state.isPanelOpen).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('togglePanel opens and closes', () => {
    useBlockStore.getState().togglePanel();
    expect(useBlockStore.getState().isPanelOpen).toBe(true);

    useBlockStore.getState().togglePanel();
    expect(useBlockStore.getState().isPanelOpen).toBe(false);
  });

  it('setPanelOpen sets state directly', () => {
    useBlockStore.getState().setPanelOpen(true);
    expect(useBlockStore.getState().isPanelOpen).toBe(true);

    useBlockStore.getState().setPanelOpen(false);
    expect(useBlockStore.getState().isPanelOpen).toBe(false);
  });

  it('setSearch updates search and resets page', () => {
    useBlockStore.setState({ page: 3 });
    useBlockStore.getState().setSearch('star');
    expect(useBlockStore.getState().search).toBe('star');
    expect(useBlockStore.getState().page).toBe(1);
  });

  it('setCategory updates category and resets page', () => {
    useBlockStore.setState({ page: 5 });
    useBlockStore.getState().setCategory('Traditional');
    expect(useBlockStore.getState().category).toBe('Traditional');
    expect(useBlockStore.getState().page).toBe(1);
  });

  it('setPage updates page', () => {
    useBlockStore.getState().setPage(3);
    expect(useBlockStore.getState().page).toBe(3);
  });

  it('initializes userBlocks as empty', () => {
    expect(useBlockStore.getState().userBlocks).toEqual([]);
    expect(useBlockStore.getState().isLoadingUserBlocks).toBe(false);
  });

  it('deleteUserBlock removes block from userBlocks locally', async () => {
    useBlockStore.setState({
      userBlocks: [
        {
          id: 'block-1',
          name: 'My Block',
          category: 'Custom',
          subcategory: null,
          tags: [],
          thumbnailUrl: null,
          isDefault: false,
          isLocked: false,
        },
        {
          id: 'block-2',
          name: 'Another Block',
          category: 'Custom',
          subcategory: null,
          tags: [],
          thumbnailUrl: null,
          isDefault: false,
          isLocked: false,
        },
      ],
    });

    // Mock fetch to return 204
    const originalFetch = global.fetch;
    global.fetch = async () => new Response(null, { status: 204 }) as Response;

    const result = await useBlockStore.getState().deleteUserBlock('block-1');
    expect(result).toBe(true);
    expect(useBlockStore.getState().userBlocks).toHaveLength(1);
    expect(useBlockStore.getState().userBlocks[0].id).toBe('block-2');

    global.fetch = originalFetch;
  });
});
