import type { Metadata } from 'next';
import { StudioClient } from '@/components/studio/StudioClient';
import { StudioMobileGate } from '@/components/mobile/StudioMobileGate';

export const metadata: Metadata = {
  title: 'Studio | QuiltCorgi',
};

export default async function StudioPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return (
    <>
      <StudioMobileGate />
      <div className="hidden md:block">
        <StudioClient projectId={projectId} />
      </div>
    </>
  );
}
