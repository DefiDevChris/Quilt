import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Photo to Design | QuiltCorgi',
  description: 'Turn a photo of your quilt into a scalable design with traced seams.',
};

export default function PhotoToDesignLayout({ children }: { readonly children: ReactNode }) {
  return <>{children}</>;
}
