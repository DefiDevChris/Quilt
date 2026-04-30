import type { Metadata } from 'next';
import { PictureMyBlocksApp } from '@/components/picture-my-blocks/PictureMyBlocksApp';

export const metadata: Metadata = {
  title: 'Picture my Blocks — QuiltCorgi',
  description:
    'Design a quilt with your uploaded blocks. Drag blocks onto a customizable grid and preview with fabrics.',
};

import PublicNav from '@/components/landing/PublicNav';

export default function PictureMyBlocksPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PublicNav />
      <main className="flex-1 min-h-0 overflow-hidden">
        <PictureMyBlocksApp />
      </main>
    </div>
  );
}
