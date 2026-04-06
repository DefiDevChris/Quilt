import { Metadata } from 'next';
import { TemplateDetailContent } from '@/components/templates/TemplateDetailContent';

export const metadata: Metadata = {
  title: 'Template | QuiltCorgi',
};

export default async function TemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  return <TemplateDetailContent templateId={templateId} mode="page" />;
}
