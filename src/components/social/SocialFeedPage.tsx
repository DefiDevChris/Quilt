'use client';

import { useState } from 'react';
import { Grid, Bookmark } from 'lucide-react';
import { SocialLayout } from './SocialLayout';
import { FeedContent } from './FeedContent';

type FeedTab = 'discover' | 'saved';

export function SocialFeedPage() {
  const [tab, setTab] = useState<FeedTab>('discover');

  return (
    <SocialLayout>
      {/* Feed tabs */}
      <div className="feed-tabs">
        <button
          onClick={() => setTab('discover')}
          className={`feed-tab ${tab === 'discover' ? 'active' : ''}`}
        >
          <Grid size={18} />
          Feed
        </button>
        <button
          onClick={() => setTab('saved')}
          className={`feed-tab ${tab === 'saved' ? 'active' : ''}`}
        >
          <Bookmark size={18} />
          Saved
        </button>
      </div>

      <FeedContent tab={tab} />
    </SocialLayout>
  );
}
