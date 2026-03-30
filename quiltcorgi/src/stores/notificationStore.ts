'use client';

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

const INITIAL_STATE = {
  notifications: [] as Notification[],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
  error: null as string | null,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...INITIAL_STATE,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });

    try {
      const res = await fetch('/api/notifications?limit=20');
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
    } catch {
      set({ error: 'Failed to load notifications', isLoading: false });
    }
  },

  markAsRead: (ids: string[]) => {
    const { notifications: prev, unreadCount: previousUnreadCount } = get();
    const previousNotifications = [...prev];

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
        if (!res.ok) {
          set({
            notifications: previousNotifications,
            unreadCount: previousUnreadCount,
          });
        }
      })
      .catch(() => {
        set({
          notifications: previousNotifications,
          unreadCount: previousUnreadCount,
        });
      });
  },

  markAllAsRead: () => {
    const { notifications: prev } = get();
    const previousNotifications = [...prev];
    const previousUnreadCount = get().unreadCount;

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
        if (!res.ok) {
          set({
            notifications: previousNotifications,
            unreadCount: previousUnreadCount,
          });
        }
      })
      .catch(() => {
        set({
          notifications: previousNotifications,
          unreadCount: previousUnreadCount,
        });
      });
  },

  toggleDropdown: () => {
    const willOpen = !get().isOpen;
    set({ isOpen: willOpen });
    if (willOpen) {
      get().fetchNotifications();
    }
  },

  reset: () => set({ ...INITIAL_STATE }),
}));
