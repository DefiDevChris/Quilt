import type { Metadata } from 'next';
import { NewStudioClient } from '@/components/studio/NewStudioClient';

export const metadata: Metadata = {
  title: 'New Design | QuiltCorgi',
};

export default function StudioNewPage() {
  return <NewStudioClient />;
}
