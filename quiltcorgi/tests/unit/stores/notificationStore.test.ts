import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useNotificationStore } from '@/stores/notificationStore';
import type { Notification } from '@/stores/notificationStore';

function makeMockNotification(
  overrides: Partial<Notification> = {}
): Notification {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'post_approved',
    title: 'Design approved!',
    message: 'Your design was approved.',
    isRead: false,
    metadata: null,
    createdAt: '2026-03-27T12:00:00Z',
    ...overrides,
  };
}

function resetStore() {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isOpen: false,
    isLoading: false,
  });
}

describe('notificationStore', () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    resetStore();
    originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            notifications: [],
            unreadCount: 0,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
  });

  afterEach(() => {
    global.fetch = originalFetch;
    useNotificationStore.getState().stopPolling();
  });

  it('initializes with default state', () => {
    const state = useNotificationStore.getState();
    expect(state.notifications).toEqual([]);
    expect(state.unreadCount).toBe(0);
    expect(state.isOpen).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('fetchNotifications updates state on success', async () => {
    const mockNotifications = [
      makeMockNotification({ id: 'n1' }),
      makeMockNotification({ id: 'n2', isRead: true }),
    ];

    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            notifications: mockNotifications,
            unreadCount: 1,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await useNotificationStore.getState().fetchNotifications();

    const state = useNotificationStore.getState();
    expect(state.notifications).toHaveLength(2);
    expect(state.unreadCount).toBe(1);
    expect(state.isLoading).toBe(false);
  });

  it('fetchNotifications handles error response', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: 'Server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await useNotificationStore.getState().fetchNotifications();

    const state = useNotificationStore.getState();
    expect(state.isLoading).toBe(false);
  });

  it('fetchNotifications handles network failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await useNotificationStore.getState().fetchNotifications();

    const state = useNotificationStore.getState();
    expect(state.isLoading).toBe(false);
  });

  it('markAsRead performs optimistic update', () => {
    const n1 = makeMockNotification({ id: 'n1', isRead: false });
    const n2 = makeMockNotification({ id: 'n2', isRead: false });
    useNotificationStore.setState({
      notifications: [n1, n2],
      unreadCount: 2,
    });

    useNotificationStore.getState().markAsRead(['n1']);

    const state = useNotificationStore.getState();
    expect(state.notifications[0].isRead).toBe(true);
    expect(state.notifications[1].isRead).toBe(false);
    expect(state.unreadCount).toBe(1);
  });

  it('markAsRead does not decrease unreadCount for already read items', () => {
    const n1 = makeMockNotification({ id: 'n1', isRead: true });
    useNotificationStore.setState({
      notifications: [n1],
      unreadCount: 0,
    });

    useNotificationStore.getState().markAsRead(['n1']);

    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('markAsRead reverts on server error', async () => {
    const n1 = makeMockNotification({ id: 'n1', isRead: false });
    useNotificationStore.setState({
      notifications: [n1],
      unreadCount: 1,
    });

    global.fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 500 })
    );

    useNotificationStore.getState().markAsRead(['n1']);

    // Optimistic update applied
    expect(useNotificationStore.getState().notifications[0].isRead).toBe(true);

    // Wait for revert
    await vi.waitFor(() => {
      expect(
        useNotificationStore.getState().notifications[0].isRead
      ).toBe(false);
      expect(useNotificationStore.getState().unreadCount).toBe(1);
    });
  });

  it('markAllAsRead performs optimistic update', () => {
    const n1 = makeMockNotification({ id: 'n1', isRead: false });
    const n2 = makeMockNotification({ id: 'n2', isRead: false });
    useNotificationStore.setState({
      notifications: [n1, n2],
      unreadCount: 2,
    });

    useNotificationStore.getState().markAllAsRead();

    const state = useNotificationStore.getState();
    expect(state.notifications.every((n) => n.isRead)).toBe(true);
    expect(state.unreadCount).toBe(0);
  });

  it('markAllAsRead reverts on server error', async () => {
    const n1 = makeMockNotification({ id: 'n1', isRead: false });
    const n2 = makeMockNotification({ id: 'n2', isRead: false });
    useNotificationStore.setState({
      notifications: [n1, n2],
      unreadCount: 2,
    });

    global.fetch = vi.fn().mockResolvedValue(
      new Response(null, { status: 500 })
    );

    useNotificationStore.getState().markAllAsRead();

    // Optimistic update applied
    expect(
      useNotificationStore.getState().notifications.every((n) => n.isRead)
    ).toBe(true);

    // Wait for revert
    await vi.waitFor(() => {
      expect(
        useNotificationStore.getState().notifications[0].isRead
      ).toBe(false);
      expect(useNotificationStore.getState().unreadCount).toBe(2);
    });
  });

  it('toggleDropdown opens and triggers fetch', () => {
    expect(useNotificationStore.getState().isOpen).toBe(false);

    useNotificationStore.getState().toggleDropdown();

    expect(useNotificationStore.getState().isOpen).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications')
    );
  });

  it('toggleDropdown closes when already open', () => {
    useNotificationStore.setState({ isOpen: true });

    useNotificationStore.getState().toggleDropdown();

    expect(useNotificationStore.getState().isOpen).toBe(false);
  });

  it('toggleDropdown does not fetch when closing', () => {
    useNotificationStore.setState({ isOpen: true });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ data: { notifications: [], unreadCount: 0 } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );
    global.fetch = fetchMock;

    useNotificationStore.getState().toggleDropdown();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('startPolling initiates fetch', () => {
    useNotificationStore.getState().startPolling();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications')
    );

    useNotificationStore.getState().stopPolling();
  });

  it('markAsRead sends correct PATCH request', () => {
    const n1 = makeMockNotification({ id: 'n1', isRead: false });
    useNotificationStore.setState({
      notifications: [n1],
      unreadCount: 1,
    });

    useNotificationStore.getState().markAsRead(['n1']);

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: ['n1'] }),
    });
  });

  it('markAllAsRead sends correct PATCH request', () => {
    const n1 = makeMockNotification({ id: 'n1', isRead: false });
    useNotificationStore.setState({
      notifications: [n1],
      unreadCount: 1,
    });

    useNotificationStore.getState().markAllAsRead();

    expect(global.fetch).toHaveBeenCalledWith('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: 'all' }),
    });
  });
});
