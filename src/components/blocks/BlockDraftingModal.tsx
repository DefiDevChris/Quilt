'use client';

import { BlockDraftingShell } from './BlockDraftingShell';

interface BlockDraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function BlockDraftingModal({ isOpen, onClose, onSaved }: BlockDraftingModalProps) {
  return <BlockDraftingShell isOpen={isOpen} onClose={onClose} onSaved={onSaved} />;
}
