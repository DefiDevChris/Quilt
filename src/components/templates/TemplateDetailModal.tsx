'use client';

import { TemplateDetailContent } from './TemplateDetailContent';

interface TemplateDetailModalProps {
  templateId: string;
  onClose: () => void;
}

export function TemplateDetailModal({ templateId, onClose }: TemplateDetailModalProps) {
  return <TemplateDetailContent templateId={templateId} mode="modal" onClose={onClose} />;
}
