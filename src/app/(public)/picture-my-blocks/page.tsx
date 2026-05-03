import type { Metadata } from 'next';
import { PictureMyBlocksApp } from '@/components/picture-my-blocks/PictureMyBlocksApp';

export const metadata: Metadata = {
  title: 'Picture my Blocks — QuiltCorgi',
  description:
    'Design a quilt with your uploaded blocks. Drag blocks onto a customizable grid and preview with fabrics.',
};

export default function PictureMyBlocksPage() {
  return (
    <div className="h-[calc(100dvh-5rem)] flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 overflow-hidden">
        <PictureMyBlocksApp />
      </main>
    </div>
  );
}
