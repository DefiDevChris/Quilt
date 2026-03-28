'use client';

import { useState, useCallback } from 'react';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { MobileDrawer } from '@/components/mobile/MobileDrawer';
import { UploadSheet } from '@/components/mobile/UploadSheet';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MobileNotifications } from '@/components/mobile/MobileNotifications';
import { useNotificationStore } from '@/stores/notificationStore';

export function MobileShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploadSheetOpen, setUploadSheetOpen] = useState(false);
  const isNotificationsOpen = useNotificationStore((s) => s.isOpen);

  const handleFabPress = useCallback(() => {
    setUploadSheetOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-5 py-2"
        style={{
          background: 'var(--glass-surface)',
          backdropFilter: 'blur(var(--glass-blur))',
          WebkitBackdropFilter: 'blur(var(--glass-blur))',
        }}
      >
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Menu"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="16" y2="17" />
          </svg>
        </button>
        <span className="text-base font-bold text-on-surface tracking-wide">QuiltCorgi</span>
        <NotificationBell />
      </header>
      <main className="px-0">{children}</main>
      <MobileBottomNav onFabPress={handleFabPress} />
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <UploadSheet isOpen={uploadSheetOpen} onClose={() => setUploadSheetOpen(false)} />
      {isNotificationsOpen && <MobileNotifications />}
    </div>
  );
}
