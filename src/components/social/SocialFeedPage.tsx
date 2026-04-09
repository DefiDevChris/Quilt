'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
      <div className="space-y-6">
        {/* Feed tabs: Discover | Saved */}
        <div className="flex items-center gap-8 border-b border-outline-variant/30 mb-2">
          {(['discover', 'saved'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative pb-3 text-sm font-black uppercase tracking-widest transition-all ${
                tab === t ? 'text-on-surface' : 'text-secondary/60 hover:text-on-surface'
              }`}
            >
              {t}
              {tab === t && (
                <motion.span
                  layoutId="feed-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Sort and Filter */}
        {tab === 'discover' && (
          <div className="space-y-6">
            {/* Sort */}
            <div className="flex items-center gap-6">
              {(['newest', 'popular'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors ${
                    sort === s ? 'text-primary' : 'text-secondary/50 hover:text-on-surface'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.label}
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider border transition-all ${
                    category === cat.value
                      ? 'bg-on-surface text-surface border-on-surface shadow-elevation-1'
                      : 'bg-surface border-outline-variant text-secondary hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <FeedContent sort={sort} category={category} tab={tab} />
      </div>
    </SocialLayout>
  );
}
