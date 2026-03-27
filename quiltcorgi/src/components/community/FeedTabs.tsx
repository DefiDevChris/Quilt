'use client';

import type { FeedTab } from '@/stores/communityStore';

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  isLoggedIn: boolean;
}

const TABS: ReadonlyArray<{ id: FeedTab; label: string; requiresAuth: boolean }> = [
  { id: 'discover', label: 'Discover', requiresAuth: false },
  { id: 'following', label: 'Following', requiresAuth: true },
  { id: 'featured', label: 'Featured', requiresAuth: false },
];

export function FeedTabs({ activeTab, onTabChange, isLoggedIn }: FeedTabsProps) {
  const visibleTabs = TABS.filter((tab) => !tab.requiresAuth || isLoggedIn);

  return (
    <div className="flex items-center gap-1 border-b border-outline-variant">
      {visibleTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'text-primary'
              : 'text-secondary hover:text-on-surface'
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
}
