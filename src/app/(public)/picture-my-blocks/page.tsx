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
    <div className="min-h-screen flex flex-col">
      <PublicNav />
      <main className="flex-1">
        <PictureMyBlocksApp />
      </main>
    </div>
  );
}
