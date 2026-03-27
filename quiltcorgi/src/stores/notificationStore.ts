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

  fetchNotifications: () => Promise<void>;
  markAsRead: (ids: string[]) => void;
  markAllAsRead: () => void;
  toggleDropdown: () => void;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollingIntervalId: ReturnType<typeof setInterval> | null = null;

const INITIAL_STATE = {
  notifications: [] as Notification[],
  unreadCount: 0,
  isOpen: false,
  isLoading: false,
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...INITIAL_STATE,

  fetchNotifications: async () => {
    set({ isLoading: true });

    try {
      const res = await fetch('/api/notifications?limit=20');
      const json = await res.json();

      if (!res.ok) {
        set({ isLoading: false });
        return;
      }

      const data = json.data;
      set({
        notifications: data.notifications,
        unreadCount: data.unreadCount,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: (ids: string[]) => {
    const { notifications: prev } = get();
    const previousNotifications = [...prev];
    const previousUnreadCount = get().unreadCount;

    const markedCount = prev.filter(
      (n) => !n.isRead && ids.includes(n.id)
    ).length;

    set({
      notifications: prev.map((n) =>
        ids.includes(n.id) ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, get().unreadCount - markedCount),
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

  startPolling: () => {
    if (pollingIntervalId !== null) return;
    get().fetchNotifications();
    pollingIntervalId = setInterval(() => {
      get().fetchNotifications();
    }, 60_000);
  },

  stopPolling: () => {
    if (pollingIntervalId !== null) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
  },
}));
