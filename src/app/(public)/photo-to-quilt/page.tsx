import type { Metadata } from 'next';
import PhotoToQuiltApp from '@/components/photo-to-quilt/PhotoToQuiltApp';

export const metadata: Metadata = {
  title: 'Photo to Quilt — QuiltCorgi',
  description:
    'Turn any photo into a quilt pattern. Upload an image, remove the background, choose your fabric palette, and generate a ready-to-sew quilt design.',
};

export default function PhotoToQuiltPage() {
  return (
    <div className="h-[calc(100dvh-5rem)] flex flex-col overflow-hidden bg-[var(--color-bg)]">
      <main className="flex-1 min-h-0 overflow-hidden">
        <PhotoToQuiltApp />
      </main>
    </div>
  );
}
