'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotificationStore } from '@/stores/notificationStore';
import { formatRelativeTime } from '@/lib/format-time';
import type { Notification } from '@/stores/notificationStore';
import { NOTIFICATION_TYPES } from '@/lib/notification-types';

const SUCCESS_ICON = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-success shrink-0">
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M6 10l2.5 2.5L14 7.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ERROR_ICON = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-error shrink-0">
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const WARNING_ICON = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-amber-500 shrink-0">
    <path
      d="M10 2L1.5 17h17L10 2z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <path d="M10 7.5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="14" r="0.75" fill="currentColor" />
  </svg>
);

const SOCIAL_ICON = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-primary shrink-0">
    <circle cx="10" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M3.5 17.5c0-3.59 2.91-6.5 6.5-6.5s6.5 2.91 6.5 6.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const INFO_ICON = (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-secondary shrink-0">
    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 6v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="10" cy="14" r="0.75" fill="currentColor" />
  </svg>
);

function getNotificationIcon(type: string) {
  switch (type) {
    case NOTIFICATION_TYPES.POST_APPROVED:
    case NOTIFICATION_TYPES.BLOG_APPROVED:
    case NOTIFICATION_TYPES.COMMENT_APPROVED:
    case 'subscription_activated':
      return SUCCESS_ICON;
    case NOTIFICATION_TYPES.POST_REJECTED:
    case NOTIFICATION_TYPES.BLOG_REJECTED:
      return ERROR_ICON;
    case NOTIFICATION_TYPES.REPORT_REVIEWED:
    case NOTIFICATION_TYPES.CONTENT_AUTO_HIDDEN:
    case 'payment_failed':
      return WARNING_ICON;
    case NOTIFICATION_TYPES.NEW_FOLLOWER:
      return SOCIAL_ICON;
    case NOTIFICATION_TYPES.COMMENT_ON_POST:
    case NOTIFICATION_TYPES.REPLY_TO_COMMENT:
    case NOTIFICATION_TYPES.COMMENT_LIKED:
      return INFO_ICON;
    default:
      return INFO_ICON;
  }
}

function getNavigationPath(notification: Notification): string | null {
  const metadata = notification.metadata as Record<string, unknown> | null;

  if (notification.type === NOTIFICATION_TYPES.NEW_FOLLOWER && metadata) {
    const username = metadata.followerUsername;
    if (typeof username === 'string') {
      return `/profile/${username}`;
    }
    return null;
  }

  if (
    notification.type === NOTIFICATION_TYPES.BLOG_APPROVED ||
    notification.type === NOTIFICATION_TYPES.BLOG_REJECTED
  ) {
    if (metadata && typeof metadata.slug === 'string') {
      return `/blog/${metadata.slug}`;
    }
    return null;
  }

  if (
    notification.type === 'payment_failed' ||
    notification.type === 'subscription_activated' ||
    notification.type === 'subscription_canceled'
  ) {
    return '/profile/billing';
  }

  if (metadata && metadata.postId && typeof metadata.postId === 'string') {
    return `/community/${metadata.postId}`;
  }

  return null;
}

export function NotificationDropdown() {
  const router = useRouter();
  const isOpen = useNotificationStore((s) => s.isOpen);
  const notificationsList = useNotificationStore((s) => s.notifications);
  const isLoading = useNotificationStore((s) => s.isLoading);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const toggleDropdown = useNotificationStore((s) => s.toggleDropdown);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        toggleDropdown();
      }
    },
    [toggleDropdown]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        toggleDropdown();
      }
    },
    [toggleDropdown]
  );

  useEffect(() => {
    if (!isOpen) return;

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleClickOutside, handleKeyDown]);

  if (!isOpen) return null;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead([notification.id]);
    }

    const path = getNavigationPath(notification);
    if (path) {
      toggleDropdown();
      router.push(path);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-80 max-h-[400px] overflow-y-auto bg-surface shadow-elevation-3 rounded-xl z-50"
      role="menu"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
        <h3 className="font-semibold text-on-surface">Notifications</h3>
        <button
          type="button"
          onClick={markAllAsRead}
          className="text-sm text-primary hover:underline"
        >
          Mark all as read
        </button>
      </div>

      {isLoading && notificationsList.length === 0 ? (
        <div className="px-4 py-8 text-center text-secondary text-sm">Loading...</div>
      ) : notificationsList.length === 0 ? (
        <div className="px-4 py-8 text-center text-secondary text-sm">No notifications yet</div>
      ) : (
        <div>
          {notificationsList.map((notification, index) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-surface-container transition-colors ${
                !notification.isRead ? 'border-l-2 border-primary' : ''
              } ${index < notificationsList.length - 1 ? 'border-b border-outline-variant' : ''}`}
              role="menuitem"
            >
              <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${
                    notification.isRead ? 'text-secondary' : 'font-medium text-on-surface'
                  }`}
                >
                  {notification.title}
                </p>
                <p className="text-sm text-secondary line-clamp-2 mt-0.5">{notification.message}</p>
                <p className="text-xs text-secondary mt-1">
                  {formatRelativeTime(notification.createdAt)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
