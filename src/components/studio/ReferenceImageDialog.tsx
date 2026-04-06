'use client';

interface ReferenceImageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (url: string) => void;
}

export function ReferenceImageDialog({
  isOpen,
  onClose,
  onSelectImage,
}: ReferenceImageDialogProps) {
  return null;
}
