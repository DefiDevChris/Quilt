import { create } from 'zustand';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  metadata: unknown;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: () => Promise<void>;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  toggleDropdown: () => void;
  reset: () => void;
}

let notificationAbortController: AbortController | null = null;

const INITIAL_STATE = {
  notifications: [] as Notification[],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
  error: null as string | null,
};

function revertNotifications(
  previousNotifications: Notification[],
  previousUnreadCount: number
): Partial<NotificationState> {
  return { notifications: previousNotifications, unreadCount: previousUnreadCount };
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...INITIAL_STATE,

  fetchNotifications: async () => {
    notificationAbortController?.abort();
    notificationAbortController = new AbortController();
    set({ isLoading: true, error: null });

    try {
      const res = await fetch('/api/notifications?limit=20', {
        signal: notificationAbortController.signal,
      });
      const json = await res.json();

      if (!res.ok) {
        set({ error: json.error ?? 'Failed to load notifications', isLoading: false });
        return;
      }

      const data = json.data;
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      set({ error: 'Failed to load notifications', isLoading: false });
    }
  },

  markAsRead: (ids: string[]) => {
    const { notifications: prev, unreadCount: previousUnreadCount } = get();
    const previousNotifications = [...prev];
    const revert = revertNotifications(previousNotifications, previousUnreadCount);

    set((state) => {
      const markedCount = state.notifications.filter((n) => !n.isRead && ids.includes(n.id)).length;
      return {
        notifications: state.notifications.map((n) =>
          ids.includes(n.id) ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - markedCount),
      };
    });

    fetch('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: ids }),
    })
      .then((res) => {
        if (!res.ok) set(revert);
      })
      .catch(() => {
        set(revert);
      });
  },

  markAllAsRead: () => {
    const { notifications: prev, unreadCount: previousUnreadCount } = get();
    const previousNotifications = [...prev];
    const revert = revertNotifications(previousNotifications, previousUnreadCount);

    set({
      notifications: prev.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    });

    fetch('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: 'all' }),
    })
      .then((res) => {
        if (!res.ok) set(revert);
      })
      .catch(() => {
        set(revert);
      });
  },

  toggleDropdown: () => {
    const willOpen = !get().isOpen;
    set({ isOpen: willOpen });
    if (willOpen) {
      get().fetchNotifications();
    }
  },

  reset: () => {
    notificationAbortController?.abort();
    notificationAbortController = null;
    set({ ...INITIAL_STATE });
  },
}));
