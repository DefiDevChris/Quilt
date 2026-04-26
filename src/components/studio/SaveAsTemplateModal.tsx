'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface SaveAsTemplateModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the template name once the user confirms */
  onSave: (name: string) => Promise<void>;
}

export default function SaveAsTemplateModal({ open, onClose, onSave }: SaveAsTemplateModalProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Template name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setName('');
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label htmlFor="template-name">Template Name</Label>
          <Input
            id="template-name"
            placeholder="My Quilt Template"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            disabled={saving}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
