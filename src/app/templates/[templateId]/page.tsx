import { Metadata } from 'next';
import { TemplateView } from '@/components/templates/TemplateView';

export const metadata: Metadata = {
  title: 'Template | QuiltCorgi',
};

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return <TemplateView templateId={templateId} />;
}
