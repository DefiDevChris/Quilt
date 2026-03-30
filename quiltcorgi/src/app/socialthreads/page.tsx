import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SocialLayout } from '@/components/social/SocialLayout';
import { FeedContent } from '@/components/social/FeedContent';
import { SavedContent } from '@/components/social/SavedContent';
import { MostSavedContent } from '@/components/social/TrendingContent';
import type { SectionId } from '@/components/social/SocialLayout';

export const metadata: Metadata = {
  title: 'Social Threads | QuiltCorgi',
  description: 'Browse and share quilt designs with the QuiltCorgi community.',
};

interface SocialThreadsPageProps {
  searchParams: Promise<{ section?: string }>;
}

export default async function SocialThreadsPage({ searchParams }: SocialThreadsPageProps) {
  const params = await searchParams;
  const section = params.section || 'feed';

  // Validate section
  const validSections: SectionId[] = ['feed', 'blog', 'saved', 'most-saved'];
  const activeSection = validSections.includes(section as SectionId)
    ? (section as SectionId)
    : 'feed';

  return (
    <SocialLayout activeSection={activeSection}>
      <Suspense fallback={<div className="animate-pulse space-y-6">
        <div className="glass-panel-social rounded-[2rem] p-6 h-32" />
        <div className="glass-panel-social rounded-[2rem] p-6 h-96" />
        <div className="glass-panel-social rounded-[2rem] p-6 h-96" />
      </div>}>
        {activeSection === 'feed' && <FeedContent />}
        {activeSection === 'saved' && <SavedContent />}
        {activeSection === 'most-saved' && <MostSavedContent />}
        {activeSection === 'blog' && (
          <div className="glass-panel-social rounded-[2rem] p-8 text-center">
            <p className="text-slate-600 font-medium mb-4">Visit our blog for detailed articles and tutorials.</p>
            <a
              href="/blog"
              className="inline-block bg-gradient-to-r from-orange-400 to-rose-400 hover:from-orange-500 hover:to-rose-500 text-white px-6 py-2.5 rounded-full font-bold shadow-md transition-all"
            >
              Go to Blog →
            </a>
          </div>
        )}
      </Suspense>
    </SocialLayout>
  );
}
