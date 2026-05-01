import type { Metadata } from 'next';
import PublicNav from '@/components/landing/PublicNav';
import PhotoToQuiltApp from '@/components/photo-to-quilt/PhotoToQuiltApp';

export const metadata: Metadata = {
  title: 'Photo to Quilt — QuiltCorgi',
  description:
    'Turn any photo into a quilt pattern. Upload an image, remove the background, choose your fabric palette, and generate a ready-to-sew quilt design.',
};

export default function PhotoToQuiltPage() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PublicNav />
      <main className="flex-1 min-h-0 overflow-hidden">
        <PhotoToQuiltApp />
      </main>
    </div>
  );
}
