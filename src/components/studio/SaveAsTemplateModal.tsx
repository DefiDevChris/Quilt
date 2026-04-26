'use client';

import { useState, useCallback } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useCanvasContext } from '@/contexts/CanvasContext';
import { useLayoutStore } from '@/stores/layoutStore';
import { useProjectStore } from '@/stores/projectStore';
import type { TemplateDataPayload } from '@/types/layoutTemplate';

interface SaveAsTemplateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'custom', label: 'Custom' },
  { value: 'traditional', label: 'Traditional' },
  { value: 'modern', label: 'Modern' },
  { value: 'baby', label: 'Baby' },
  { value: 'seasonal', label: 'Seasonal' },
];

/**
 * SaveAsTemplateModal
 *
 * Modal that snapshots the current Studio canvas as a reusable template.
 * Captures:
 *   - Fabric.js `toJSON()` of the canvas
 *   - SVG thumbnail via `toSVG()`
 *   - Current layout-store config (rows / cols / sashing / borders / etc.)
 *   - Project canvas dimensions
 *
 * POSTs to `/api/templates`. On success the modal closes and a toast confirms.
 */
export function SaveAsTemplateModal({ isOpen, onClose }: SaveAsTemplateModalProps) {
  const { getCanvas } = useCanvasContext();
  const projectName = useProjectStore((s) => s.projectName);

  const [name, setName] = useState(projectName || 'My Template');
  const [category, setCategory] = useState<string>('custom');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (submitting) return;
      const canvas = getCanvas();
      if (!canvas) {
        setError('Canvas not available — try again in a moment.');
        return;
      }

      setSubmitting(true);
      setError(null);

      try {
        const c = canvas as unknown as {
          toJSON: () => Record<string, unknown>;
          toSVG?: (opts?: Record<string, unknown>) => string;
        };
        const canvasJson = c.toJSON();
        const thumbnailSvg = typeof c.toSVG === 'function' ? c.toSVG() : undefined;

        const ls = useLayoutStore.getState();
        const ps = useProjectStore.getState();

        const templateData: TemplateDataPayload = {
          canvasJson,
          canvasWidth: ps.canvasWidth,
          canvasHeight: ps.canvasHeight,
          layoutConfig: {
            layoutType: ls.layoutType,
            rows: ls.rows,
            cols: ls.cols,
            blockSize: ls.blockSize,
            sashing: { width: ls.sashing.width, color: ls.sashing.color, fabricId: ls.sashing.fabricId },
            borders: ls.borders.map((b) => ({
              width: b.width,
              color: b.color,
              fabricId: b.fabricId,
            })),
            hasCornerstones: ls.hasCornerstones,
            bindingWidth: ls.bindingWidth,
          },
        };

        const res = await fetch('/api/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: name.trim(),
            category,
            description: description.trim() || undefined,
            templateData,
            thumbnailSvg,
          }),
        });

        if (!res.ok) {
          let message = 'Save failed';
          try {
            const data = (await res.json()) as { message?: string };
            if (data?.message) message = data.message;
          } catch {
            // ignore parse errors
          }
          setError(message);
          return;
        }

        toast({
          type: 'success',
          title: 'Template saved',
          description: 'Available in My Templates next session.',
        });
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, getCanvas, name, category, description, toast, onClose]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-lg bg-[var(--color-surface)] p-6 shadow-elevated"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-[18px] font-semibold text-[var(--color-text)]">Save as Template</h2>
            <p className="text-[12px] text-[var(--color-text-dim)] mt-0.5">
              Reuse this design as a starting point for future projects.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors duration-150"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-[12px] font-medium text-[var(--color-text)]">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={255}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)]/40 bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none transition-colors duration-150"
            />
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-[var(--color-text)]">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)]/40 bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none transition-colors duration-150"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-[var(--color-text)]">Description (optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1 w-full rounded-lg border border-[var(--color-border)]/40 bg-[var(--color-bg)] px-3 py-2 text-[13px] text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none transition-colors duration-150"
            />
          </label>

          {error && (
            <p className="text-[12px] text-[var(--color-error)]" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || name.trim().length === 0}
            className="btn-primary"
          >
            {submitting ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </form>
    </div>
  );
}
