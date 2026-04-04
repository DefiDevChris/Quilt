'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';

interface SaveAsTemplateButtonProps {
  projectName: string;
  unitSystem: 'imperial' | 'metric';
  canvasWidth: number;
  canvasHeight: number;
  gridSettings: {
    enabled: boolean;
    size: number;
    snapToGrid: boolean;
  };
}

export function SaveAsTemplateButton({
  projectName,
  unitSystem,
  canvasWidth,
  canvasHeight,
  gridSettings,
}: SaveAsTemplateButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [templateName, setTemplateName] = useState(`${projectName} Template`);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch('/api/project-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: templateName,
          unitSystem,
          canvasWidth,
          canvasHeight,
          gridSettings,
        }),
      });

      if (!res.ok) throw new Error('Failed to save template');

      setShowDialog(false);
      setTemplateName(`${projectName} Template`);
      // Could add a toast notification here
    } catch {
      // Failed to save template
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-secondary hover:text-on-surface transition-colors"
        title="Save as Template"
      >
        <Save size={16} />
        Save as Template
      </button>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
          <div className="w-full max-w-sm rounded-xl bg-surface shadow-elevation-3 p-6">
            <h3 className="text-lg font-semibold text-on-surface mb-4">Save as Template</h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="template-name"
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  Template Name
                </label>
                <input
                  id="template-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  required
                />
              </div>

              <div className="text-xs text-secondary space-y-1">
                <p>
                  Canvas: {canvasWidth}&quot; × {canvasHeight}&quot;
                </p>
                <p>Units: {unitSystem}</p>
                <p>Grid: {gridSettings.enabled ? `${gridSettings.size}" grid` : 'disabled'}</p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-container rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
