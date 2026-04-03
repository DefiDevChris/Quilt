import type { Metadata } from 'next';
import { StudioClient } from '@/components/studio/StudioClient';
import { StudioGate } from '@/components/mobile/StudioGate';

export const metadata: Metadata = {
  title: 'Studio | QuiltCorgi',
};

export default async function StudioPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <>
      <StudioGate />
      <div className="hidden md:block">
        <StudioClient projectId={projectId} />
      </div>
    </>
  );
}
