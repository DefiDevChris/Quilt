import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useCommunityStore } from '@/stores/communityStore';
import type { CommunityPost } from '@/stores/communityStore';

function makeMockPost(overrides: Partial<CommunityPost> = {}): CommunityPost {
  return {
    id: 'post-1',
    title: 'Test Quilt',
    description: null,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    likeCount: 5,
    commentCount: 0,
    category: 'general',
    creatorName: 'Jane',
    creatorUsername: null,
    creatorAvatarUrl: null,
    creatorId: null,
    isPro: false,
    projectId: null,
    projectName: null,
    projectThumbnailUrl: null,
    createdAt: '2026-03-27T00:00:00Z',
    isLikedByUser: false,
    isSavedByUser: false,
    ...overrides,
  };
}

function resetStore() {
  useCommunityStore.setState({
    posts: [],
    search: '',
    sort: 'newest',
    tab: 'discover',
    category: undefined,
    page: 1,
    totalPages: 1,
    total: 0,
    isLoading: false,
    error: null,
  });
}

describe('communityStore', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    resetStore();
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            posts: [],
            pagination: { total: 0, totalPages: 1, page: 1 },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('initializes with default state', () => {
    const state = useCommunityStore.getState();
    expect(state.posts).toEqual([]);
    expect(state.search).toBe('');
    expect(state.sort).toBe('newest');
    expect(state.page).toBe(1);
    expect(state.totalPages).toBe(1);
    expect(state.total).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('setSearch resets page to 1 and updates search', () => {
    useCommunityStore.setState({ page: 3 });
    useCommunityStore.getState().setSearch('star quilt');
    expect(useCommunityStore.getState().search).toBe('star quilt');
    expect(useCommunityStore.getState().page).toBe(1);
  });

  it('setSort resets page to 1 and updates sort', () => {
    useCommunityStore.setState({ page: 5 });
    useCommunityStore.getState().setSort('popular');
    expect(useCommunityStore.getState().sort).toBe('popular');
    expect(useCommunityStore.getState().page).toBe(1);
  });

  it('initializes tab and category with defaults', () => {
    const state = useCommunityStore.getState();
    expect(state.tab).toBe('discover');
    expect(state.category).toBeUndefined();
  });

  it('setTab resets page to 1 and updates tab', () => {
    useCommunityStore.setState({ page: 3 });
    useCommunityStore.getState().setTab('featured');
    expect(useCommunityStore.getState().tab).toBe('featured');
    expect(useCommunityStore.getState().page).toBe(1);
  });

  it('setCategory resets page to 1 and updates category', () => {
    useCommunityStore.setState({ page: 4 });
    useCommunityStore.getState().setCategory('help');
    expect(useCommunityStore.getState().category).toBe('help');
    expect(useCommunityStore.getState().page).toBe(1);
  });

  it('setCategory clears category when undefined', () => {
    useCommunityStore.setState({ category: 'wip' });
    useCommunityStore.getState().setCategory(undefined);
    expect(useCommunityStore.getState().category).toBeUndefined();
  });

  it('likePost performs optimistic update', () => {
    const post = makeMockPost({ id: 'post-1', likeCount: 3, isLikedByUser: false });
    useCommunityStore.setState({ posts: [post] });

    useCommunityStore.getState().likePost('post-1');

    const updated = useCommunityStore.getState().posts[0];
    expect(updated.likeCount).toBe(4);
    expect(updated.isLikedByUser).toBe(true);
  });

  it('unlikePost performs optimistic update', () => {
    const post = makeMockPost({ id: 'post-1', likeCount: 5, isLikedByUser: true });
    useCommunityStore.setState({ posts: [post] });

    useCommunityStore.getState().unlikePost('post-1');

    const updated = useCommunityStore.getState().posts[0];
    expect(updated.likeCount).toBe(4);
    expect(updated.isLikedByUser).toBe(false);
  });

  it('unlikePost does not go below 0', () => {
    const post = makeMockPost({ id: 'post-1', likeCount: 0, isLikedByUser: true });
    useCommunityStore.setState({ posts: [post] });

    useCommunityStore.getState().unlikePost('post-1');

    const updated = useCommunityStore.getState().posts[0];
    expect(updated.likeCount).toBe(0);
    expect(updated.isLikedByUser).toBe(false);
  });

  it('likePost is a no-op for unknown postId', () => {
    const post = makeMockPost({ id: 'post-1', likeCount: 3 });
    useCommunityStore.setState({ posts: [post] });

    useCommunityStore.getState().likePost('nonexistent');

    expect(useCommunityStore.getState().posts[0].likeCount).toBe(3);
  });

  it('reset returns to initial state', () => {
    useCommunityStore.setState({
      posts: [makeMockPost()],
      search: 'quilts',
      sort: 'popular',
      page: 3,
      totalPages: 5,
      total: 100,
      isLoading: true,
      error: 'some error',
    });

    useCommunityStore.getState().reset();

    const state = useCommunityStore.getState();
    expect(state.posts).toEqual([]);
    expect(state.search).toBe('');
    expect(state.sort).toBe('newest');
    expect(state.page).toBe(1);
    expect(state.totalPages).toBe(1);
    expect(state.total).toBe(0);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('fetchPosts calls fetch with correct params', async () => {
    useCommunityStore.setState({ search: 'star', sort: 'popular', page: 2 });

    await useCommunityStore.getState().fetchPosts();

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/community?'));
    const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('search=star');
    expect(callUrl).toContain('sort=popular');
    expect(callUrl).toContain('page=2');
    expect(callUrl).toContain('limit=24');
  });

  it('fetchPosts replaces posts when append=false', async () => {
    const existingPost = makeMockPost({ id: 'existing' });
    const newPost = makeMockPost({ id: 'new' });

    useCommunityStore.setState({ posts: [existingPost] });

    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            posts: [newPost],
            pagination: { total: 1, totalPages: 1, page: 1 },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await useCommunityStore.getState().fetchPosts(false);

    expect(useCommunityStore.getState().posts).toHaveLength(1);
    expect(useCommunityStore.getState().posts[0].id).toBe('new');
  });

  it('fetchPosts appends posts when append=true', async () => {
    const existingPost = makeMockPost({ id: 'existing' });
    const newPost = makeMockPost({ id: 'new' });

    useCommunityStore.setState({ posts: [existingPost] });

    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            posts: [newPost],
            pagination: { total: 2, totalPages: 1, page: 1 },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await useCommunityStore.getState().fetchPosts(true);

    expect(useCommunityStore.getState().posts).toHaveLength(2);
    expect(useCommunityStore.getState().posts[0].id).toBe('existing');
    expect(useCommunityStore.getState().posts[1].id).toBe('new');
  });

  it('fetchPosts handles error response', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await useCommunityStore.getState().fetchPosts();

    expect(useCommunityStore.getState().error).toBe('Server error');
    expect(useCommunityStore.getState().isLoading).toBe(false);
  });

  it('fetchPosts handles network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await useCommunityStore.getState().fetchPosts();

    expect(useCommunityStore.getState().error).toBe('Failed to load community posts');
    expect(useCommunityStore.getState().isLoading).toBe(false);
  });

  it('loadMore increments page and appends', async () => {
    const existingPost = makeMockPost({ id: 'existing' });
    useCommunityStore.setState({ posts: [existingPost], page: 1, totalPages: 3 });

    const newPost = makeMockPost({ id: 'page2' });
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            posts: [newPost],
            pagination: { total: 2, totalPages: 3, page: 2 },
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await useCommunityStore.getState().loadMore();

    expect(useCommunityStore.getState().posts).toHaveLength(2);
    expect(useCommunityStore.getState().page).toBe(2);
  });

  it('likePost reverts on server error', async () => {
    const post = makeMockPost({ id: 'post-1', likeCount: 3, isLikedByUser: false });
    useCommunityStore.setState({ posts: [post] });

    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    useCommunityStore.getState().likePost('post-1');

    // Optimistic update happens synchronously
    expect(useCommunityStore.getState().posts[0].likeCount).toBe(4);

    // Wait for the fetch to resolve and revert
    await vi.waitFor(() => {
      const current = useCommunityStore.getState().posts[0];
      expect(current.likeCount).toBe(3);
      expect(current.isLikedByUser).toBe(false);
    });
  });

  it('unlikePost reverts on server error', async () => {
    const post = makeMockPost({ id: 'post-1', likeCount: 5, isLikedByUser: true });
    useCommunityStore.setState({ posts: [post] });

    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    useCommunityStore.getState().unlikePost('post-1');

    // Optimistic update happens synchronously
    expect(useCommunityStore.getState().posts[0].likeCount).toBe(4);

    // Wait for the fetch to resolve and revert
    await vi.waitFor(() => {
      const current = useCommunityStore.getState().posts[0];
      expect(current.likeCount).toBe(5);
      expect(current.isLikedByUser).toBe(true);
    });
  });

  it('savePost performs optimistic update', () => {
    const post = makeMockPost({ id: 'post-1', isSavedByUser: false });
    useCommunityStore.setState({ posts: [post] });

    useCommunityStore.getState().savePost('post-1');

    expect(useCommunityStore.getState().posts[0].isSavedByUser).toBe(true);
  });

  it('unsavePost performs optimistic update', () => {
    const post = makeMockPost({ id: 'post-1', isSavedByUser: true });
    useCommunityStore.setState({ posts: [post] });

    useCommunityStore.getState().unsavePost('post-1');

    expect(useCommunityStore.getState().posts[0].isSavedByUser).toBe(false);
  });

  it('savePost reverts on server error', async () => {
    const post = makeMockPost({ id: 'post-1', isSavedByUser: false });
    useCommunityStore.setState({ posts: [post] });

    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    useCommunityStore.getState().savePost('post-1');

    expect(useCommunityStore.getState().posts[0].isSavedByUser).toBe(true);

    await vi.waitFor(() => {
      expect(useCommunityStore.getState().posts[0].isSavedByUser).toBe(false);
    });
  });

  it('unsavePost reverts on server error', async () => {
    const post = makeMockPost({ id: 'post-1', isSavedByUser: true });
    useCommunityStore.setState({ posts: [post] });

    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 401 }));

    useCommunityStore.getState().unsavePost('post-1');

    expect(useCommunityStore.getState().posts[0].isSavedByUser).toBe(false);

    await vi.waitFor(() => {
      expect(useCommunityStore.getState().posts[0].isSavedByUser).toBe(true);
    });
  });

  it('savePost is a no-op for unknown postId', () => {
    const post = makeMockPost({ id: 'post-1', isSavedByUser: false });
    useCommunityStore.setState({ posts: [post] });

    useCommunityStore.getState().savePost('nonexistent');

    expect(useCommunityStore.getState().posts[0].isSavedByUser).toBe(false);
  });

  it('fetchPosts includes tab and category in params', async () => {
    useCommunityStore.setState({ tab: 'featured', category: 'help', page: 1 });

    await useCommunityStore.getState().fetchPosts();

    const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('tab=featured');
    expect(callUrl).toContain('category=help');
  });

  it('fetchPosts omits category param when undefined', async () => {
    useCommunityStore.setState({ tab: 'discover', category: undefined, page: 1 });

    await useCommunityStore.getState().fetchPosts();

    const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(callUrl).toContain('tab=discover');
    expect(callUrl).not.toContain('category=');
  });
});
