'use client';

import { useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { useCanvasContext } from '@/contexts/CanvasContext';

interface SaveAsTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional callback fired when a template was successfully saved. */
  onSaved?: (templateId: string) => void;
}

/**
 * SaveAsTemplateModal
 *
 * Captures the current canvas + layout config and POSTs it to
 * `/api/templates`. The user names + categorizes it; on success the
 * template is available in the My Templates tab the next time they
 * open the New Project flow.
 *
 * Snapshotting strategy:
 *   - canvasData    = `fabricCanvas.toJSON()` (Fabric.js full object tree)
 *   - thumbnailSvg  = a small SVG export for catalog rendering
 *   - layoutConfig  = current layout store values (rows/cols/sashing/borders)
 *   - canvasWidth   = current project store dimensions
 *
 * The save is best-effort — if Fabric.js or the SVG export fails we still
 * try to save the layout config + dimensions, which is enough to
 * re-instantiate a similar quilt later.
 */
export function SaveAsTemplateModal({ isOpen, onClose, onSaved }: SaveAsTemplateModalProps) {
  const { getCanvas } = useCanvasContext();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('custom');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = useCallback(async () => {
    setError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please give your template a name');
      return;
    }

    setSaving(true);
    try {
      const canvas = getCanvas() as
        | {
            toJSON: (extra?: string[]) => Record<string, unknown>;
            toSVG: () => string;
          }
        | null;

      const layoutState = useLayoutStore.getState();
      const projectState = useProjectStore.getState();

      let canvasData: Record<string, unknown> | null = null;
      let thumbnailSvg: string | null = null;

      if (canvas) {
        try {
          canvasData = canvas.toJSON([
            '__fabricId',
            '__pieceRole',
            '__shade',
            '__blockPatchIndex',
            '__isPatternFill',
          ]);
        } catch (err) {
          console.warn('[SaveAsTemplate] toJSON failed', err);
        }
        try {
          thumbnailSvg = canvas.toSVG();
        } catch (err) {
          console.warn('[SaveAsTemplate] toSVG failed', err);
        }
      }

      const payload = {
        name: trimmed,
        description: description.trim() || undefined,
        category,
        thumbnailSvg,
        templateData: {
          layoutConfig: {
            type: layoutState.layoutType,
            rows: layoutState.rows,
            cols: layoutState.cols,
            blockSize: layoutState.blockSize,
            sashing: layoutState.sashing,
            borders: layoutState.borders,
          },
          canvasData,
          canvasWidth: projectState.canvasWidth,
          canvasHeight: projectState.canvasHeight,
          fabricAssignments: [],
        },
      };

      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as {
        success: boolean;
        data?: { template?: { id: string } };
        error?: string;
      };
      if (!res.ok || !body.success) {
        throw new Error(body.error ?? 'Failed to save template');
      }

      toast({
        type: 'success',
        title: 'Template saved',
        description: `"${trimmed}" is now in My Templates.`,
      });
      if (body.data?.template?.id) {
        onSaved?.(body.data.template.id);
      }
      setName('');
      setDescription('');
      setCategory('custom');
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save template';
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [name, description, category, getCanvas, toast, onClose, onSaved]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-template-title"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-[var(--color-surface)] p-6 shadow-elevated">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Close"
        >
          <X size={16} strokeWidth={1.75} />
        </button>

        <h2
          id="save-template-title"
          className="text-[18px] font-semibold text-[var(--color-text)] mb-1"
        >
          Save as Template
        </h2>
        <p className="text-[13px] text-[var(--color-text-dim)] mb-5">
          Save your current design as a reusable template. It will appear in My Templates the next time you start a new project.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text)] mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="My Star Quilt"
              maxLength={255}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text)] mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="custom">Custom</option>
              <option value="traditional">Traditional</option>
              <option value="modern">Modern</option>
              <option value="baby">Baby</option>
              <option value="seasonal">Seasonal</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--color-text)] mb-1">
              Description{' '}
              <span className="text-[var(--color-text-dim)]/70 font-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short description of your template…"
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-[13px] focus:border-[var(--color-primary)] focus:outline-none resize-none"
            />
          </div>

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
            disabled={saving}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
