'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ProjectModeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: 'template' | 'layout' | 'freeform') => void;
}

export default function ProjectModeModal({ open, onClose, onSelect }: ProjectModeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Choose a Project Mode</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Pick how you want to start designing. This choice cannot be changed once you begin.
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => onSelect('template')}>
            <div className="text-left">
              <div className="font-semibold">Start from a Template</div>
              <div className="text-xs text-muted-foreground">Choose a pre-built quilt layout and customise fabrics</div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => onSelect('layout')}>
            <div className="text-left">
              <div className="font-semibold">Layout Mode</div>
              <div className="text-xs text-muted-foreground">Pick a standard quilt size and build block-by-block</div>
            </div>
          </Button>
          <Button variant="outline" className="justify-start h-auto py-3 px-4" onClick={() => onSelect('freeform')}>
            <div className="text-left">
              <div className="font-semibold">Freeform Mode</div>
              <div className="text-xs text-muted-foreground">Set custom dimensions and draw freely</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
