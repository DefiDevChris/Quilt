'use client';

import { useState } from 'react';
import { SocialLayout } from './SocialLayout';
import { FeedContent } from './FeedContent';

const CATEGORIES = [
  { value: undefined as string | undefined, label: 'All' },
  { value: 'show-and-tell', label: 'Show & Tell' },
  { value: 'wip', label: 'WIP' },
  { value: 'help', label: 'Help' },
  { value: 'inspiration', label: 'Inspiration' },
  { value: 'general', label: 'General' },
];

type FeedTab = 'discover' | 'saved';

export function SocialFeedPage() {
  const [sort, setSort] = useState<'newest' | 'popular'>('newest');
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [tab, setTab] = useState<FeedTab>('discover');

  return (
    <SocialLayout activeSection="feed">
      <div className="space-y-4">
        {/* Feed tabs: Discover | Saved */}
        <div className="flex items-center gap-1 border-b border-white/40 mb-1">
          {(['discover', 'saved'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2.5 text-sm font-semibold transition-colors capitalize ${tab === t ? 'text-on-surface' : 'text-secondary hover:text-on-surface'
                }`}
            >
              {t === 'discover' ? 'Discover' : 'Saved'}
              {tab === t && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Sort tabs + Category chips (only on discover tab) */}
        {tab === 'discover' && (
          <>
            {/* Sort */}
            <div className="flex items-center gap-3">
              {(['newest', 'popular'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`text-sm font-semibold transition-colors capitalize ${sort === s ? 'text-on-surface' : 'text-secondary hover:text-on-surface'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${category === cat.value
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-elevation-1'
                    : 'bg-surface-container text-secondary hover:bg-surface-container-high hover:text-on-surface'
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </>
        )}

        <FeedContent sort={sort} category={category} tab={tab} />
      </div>
    </SocialLayout>
  );
}
