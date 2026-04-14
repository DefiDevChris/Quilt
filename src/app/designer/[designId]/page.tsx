import type { Metadata } from 'next';
import { DesignerClient } from '@/components/designer/DesignerClient';
import { DesignerGate } from '@/components/designer/DesignerGate';

export const metadata: Metadata = {
  title: 'Designer | QuiltCorgi',
};

export default async function DesignerPage({ params }: { params: Promise<{ designId: string }> }) {
  const { designId } = await params;

  return (
    <>
      <DesignerGate />
      <div className="hidden md:block">
        <DesignerClient designId={designId} />
      </div>
    </>
  );
}
