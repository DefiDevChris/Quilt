import type { Metadata } from 'next';
import { PictureMyBlocksApp } from '@/components/picture-my-blocks/PictureMyBlocksApp';

export const metadata: Metadata = {
  title: 'Picture my Blocks — QuiltCorgi',
  description:
    'Take pictures of your finished quilt blocks, drop them into a layout, pick a background fabric, and see your quilt before you sew it.',
};

export default function PictureMyBlocksPage() {
  return <PictureMyBlocksApp />;
}
