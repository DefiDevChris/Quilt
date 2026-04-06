import { describe, it, expect, beforeEach } from 'vitest';
import { useBlockStore } from '@/stores/blockStore';

describe('blockStore', () => {
  beforeEach(() => {
    useBlockStore.getState().reset();
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
          svgData: null,
          photoUrl: null,
          isDefault: false,
          isLocked: false,
          blockType: 'custom' as const,
        },
        {
          id: 'block-2',
          name: 'Another Block',
          category: 'Custom',
          subcategory: null,
          tags: [],
          thumbnailUrl: null,
          svgData: null,
          photoUrl: null,
          isDefault: false,
          isLocked: false,
          blockType: 'custom' as const,
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

  it('fetchUserBlocks fetches and sets userBlocks', async () => {
    const mockBlocks = [
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
    ];
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { blocks: mockBlocks } }),
    });

    await useBlockStore.getState().fetchUserBlocks();
    expect(useBlockStore.getState().userBlocks).toEqual(mockBlocks);
    expect(useBlockStore.getState().isLoadingUserBlocks).toBe(false);

    global.fetch = originalFetch;
  });

  it('fetchUserBlocks handles error', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed' }),
    });

    await useBlockStore.getState().fetchUserBlocks();
    expect(useBlockStore.getState().userBlocks).toEqual([]);
    expect(useBlockStore.getState().isLoadingUserBlocks).toBe(false);

    global.fetch = originalFetch;
  });

  it('fetchUserBlocks handles fetch error (exception)', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    await useBlockStore.getState().fetchUserBlocks();
    expect(useBlockStore.getState().userBlocks).toEqual([]);
    expect(useBlockStore.getState().isLoadingUserBlocks).toBe(false);
    expect(useBlockStore.getState().error).toBe('Failed to load your blocks');

    global.fetch = originalFetch;
  });

  it('fetchBlocks handles fetch exception', async () => {
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

    await useBlockStore.getState().fetchBlocks();
    expect(useBlockStore.getState().error).toBe('Failed to load blocks');
    expect(useBlockStore.getState().isLoading).toBe(false);

    global.fetch = originalFetch;
  });

  it('reset aborts controllers and clears state', () => {
    useBlockStore.setState({
      blocks: [
        {
          id: '1',
          name: 'Test',
          category: 'A',
          subcategory: null,
          tags: [],
          thumbnailUrl: null,
          svgData: null,
          photoUrl: null,
          isDefault: false,
          isLocked: false,
          blockType: 'svg' as const,
        },
      ],
      userBlocks: [
        {
          id: '2',
          name: 'User',
          category: 'B',
          subcategory: null,
          tags: [],
          thumbnailUrl: null,
          svgData: null,
          photoUrl: null,
          isDefault: false,
          isLocked: false,
          blockType: 'custom' as const,
        },
      ],
      search: 'test',
      category: 'cat',
      page: 5,
      totalPages: 10,
      total: 100,
      isPanelOpen: true,
    });

    useBlockStore.getState().reset();
    const state = useBlockStore.getState();
    expect(state.blocks).toEqual([]);
    expect(state.userBlocks).toEqual([]);
    expect(state.search).toBe('');
    expect(state.category).toBe('');
    expect(state.page).toBe(1);
    expect(state.totalPages).toBe(1);
    expect(state.total).toBe(0);
    expect(state.isPanelOpen).toBe(false);
  });
});
