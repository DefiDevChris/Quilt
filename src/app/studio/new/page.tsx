import type { Metadata } from 'next';
import { NewStudioClient } from '@/components/studio/NewStudioClient';
import { StudioGate } from '@/components/mobile/StudioGate';

export const metadata: Metadata = {
  title: 'New Design | QuiltCorgi',
};

export default function StudioNewPage() {
  return (
    <>
      <StudioGate />
      <div className="hidden md:block">
        <NewStudioClient />
      </div>
    </>
  );
}
