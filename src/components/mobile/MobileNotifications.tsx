'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatRelativeTime } from '@/lib/format-time';
import type { Notification } from '@/stores/notificationStore';

function getNavigationPath(notification: Notification): string | null {
  const metadata = notification.metadata as Record<string, unknown> | null;

  if (notification.type === 'blog_approved' || notification.type === 'blog_rejected') {
    return '/socialthreads';
  }

  if (
    notification.type === 'payment_failed' ||
    notification.type === 'subscription_activated' ||
    notification.type === 'subscription_canceled'
  ) {
    return '/settings#billing';
  }

  if (metadata && metadata.postId && typeof metadata.postId === 'string') {
    return `/socialthreads/${metadata.postId}`;
  }

  return null;
}

export function MobileNotifications() {
  const router = useRouter();
  const notifications = useNotificationStore((s) => s.notifications);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const toggleDropdown = useNotificationStore((s) => s.toggleDropdown);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  function handleClose() {
    toggleDropdown();
  }

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }
    const path = getNavigationPath(notification);
    if (path) {
      toggleDropdown();
      router.push(path);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-default flex flex-col">
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-default transition-colors"
          aria-label="Close notifications"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <h1 className="text-[16px] leading-[24px] font-bold text-default">Notifications</h1>
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-[14px] leading-[20px] font-semibold text-primary"
        >
          Read all
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="px-5 py-16 text-center text-secondary text-sm">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-16 text-center text-secondary text-sm">No notifications yet</div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-left px-5 py-4 flex gap-3 hover:bg-default transition-colors ${!notification.isRead ? 'bg-default' : ''
                  }`}
              >
                {!notification.isRead && (
                  <div className="w-2 h-2 rounded-full mt-2 shrink-0 bg-primary" />
                )}
                <div className={`flex-1 min-w-0 ${notification.isRead ? 'pl-5' : ''}`}>
                  <p
                    className={`text-[14px] leading-[20px] ${notification.isRead ? 'text-secondary' : 'font-medium text-default'}`}
                  >
                    {notification.title}
                  </p>
                  <p className="text-[14px] leading-[20px] text-secondary line-clamp-2 mt-0.5">
                    {notification.message}
                  </p>
                  <p className="text-[14px] leading-[20px] text-dim mt-1">
                    {formatRelativeTime(notification.createdAt)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
