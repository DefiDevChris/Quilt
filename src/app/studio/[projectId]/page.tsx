import type { Metadata } from 'next';
import { StudioClient } from '@/components/studio/StudioClient';

export const metadata: Metadata = {
  title: 'Studio | QuiltCorgi',
};

export default async function StudioPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <StudioClient projectId={projectId} />;
}
