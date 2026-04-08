import type { Metadata } from 'next';
import { PhotoToDesignWizard } from '@/components/photo-layout/PhotoToDesignWizard';

export const metadata: Metadata = {
  title: 'Photo to Design | QuiltCorgi',
  description:
    'Upload a photo of any quilt and extract individual pieces using AI. Redesign, reassign fabrics, and create print-ready patterns.',
};

export default function PhotoToDesignPage({
  searchParams,
}: {
  searchParams: Promise<{ preloadUrl?: string; action?: string }>;
}) {
  return <PhotoToDesignWizardWrapper searchParams={searchParams} />;
}

async function PhotoToDesignWizardWrapper({
  searchParams,
}: {
  searchParams: Promise<{ preloadUrl?: string; action?: string }>;
}) {
  const params = await searchParams;
  const preloadedImageUrl = params.preloadUrl;

  return <PhotoToDesignWizard preloadedImageUrl={preloadedImageUrl} />;
}
