'use client';

import { Home, Compass, Bookmark } from 'lucide-react';

const menuItems = [
  { icon: Home, label: 'Home', active: true },
  { icon: Compass, label: 'Explore' },
  { icon: Bookmark, label: 'Saved', isSaved: true },
];

interface SidebarProps {
  className?: string;
  onSavedClick?: () => void;
  savedCount?: number;
}

export function Sidebar({ className = '', onSavedClick, savedCount = 0 }: SidebarProps) {
  return (
    <aside className={`w-64 border-r border-[var(--color-border)] bg-white ${className}`}>
      <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-5 space-y-6">
          <button className="w-full bg-[var(--color-primary)] text-white font-medium py-6 rounded-full text-sm transition-colors duration-150 hover:bg-[#e67d3f]">
            Create Post
          </button>

          <nav className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={(e) => {
                  if (item.isSaved && onSavedClick) {
                    e.preventDefault();
                    onSavedClick();
                  }
                }}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-full text-sm font-medium transition-colors duration-150 ${
                  item.active
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-[var(--color-text-dim)] hover:bg-[var(--color-bg)]'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.isSaved && savedCount > 0 && (
                  <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full font-medium min-w-[20px] text-center">
                    {savedCount}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="pt-5 border-t border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-text-dim)]">&copy; 2026 QuiltCorgi</p>
            <div className="flex justify-center gap-4 mt-1.5">
              <a href="/privacy" className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150">Privacy</a>
              <a href="/terms" className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150">Terms</a>
              <a href="/help" className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors duration-150">Help</a>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
