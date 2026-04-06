'use client';

import { useEffect } from 'react';
import { useNotificationStore } from '@/stores/notificationStore';

export function NotificationBell() {
  const isOpen = useNotificationStore((s) => s.isOpen);
  const toggleDropdown = useNotificationStore((s) => s.toggleDropdown);
  const fetchNotifications = useNotificationStore((s) => s.fetchNotifications);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <button
      type="button"
      onClick={toggleDropdown}
      aria-label="Notifications"
      aria-expanded={isOpen}
      className="relative p-1.5 rounded-lg hover:bg-surface-container transition-colors"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-on-surface"
      >
        <path d="M10 2C7.24 2 5 4.24 5 7v3.5L3.5 13h13L15 10.5V7c0-2.76-2.24-5-5-5z" />
        <path d="M8 15a2 2 0 0 0 4 0" />
      </svg>
    </button>
  );
}
