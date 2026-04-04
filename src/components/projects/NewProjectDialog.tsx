'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectTemplates } from '@/components/studio/ProjectTemplates';
import { LAYOUT_PRESETS, type LayoutPreset } from '@/lib/layout-library';

interface NewProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onBrowsePatterns?: () => void;
}

interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  unitSystem: 'imperial' | 'metric';
  gridSettings: {
    enabled: boolean;
    size: number;
    snapToGrid: boolean;
  };
  canvasWidth: number;
  canvasHeight: number;
  createdAt: string;
}

export function NewProjectDialog({ open, onClose, onBrowsePatterns }: NewProjectDialogProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'blank' | 'template' | 'layout'>('blank');
  const [name, setName] = useState('Untitled Quilt');
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [canvasWidth, setCanvasWidth] = useState(48);
  const [canvasHeight, setCanvasHeight] = useState(48);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  if (!open) return null;

  const handleSelectTemplate = (template: ProjectTemplate) => {
    setName(`${template.name} Copy`);
    setUnitSystem(template.unitSystem);
    setCanvasWidth(template.canvasWidth);
    setCanvasHeight(template.canvasHeight);
    setGridEnabled(template.gridSettings.enabled);
    setGridSize(template.gridSettings.size);
    setSnapToGrid(template.gridSettings.snapToGrid);
    setActiveTab('blank');
  };

  const handleSelectLayoutPreset = (preset: LayoutPreset) => {
    setName(preset.name);
    setUnitSystem('imperial');
    const config = preset.config;
    const totalWidth = config.cols * config.blockSize + (config.sashing.width * (config.cols - 1)) + config.borders.reduce((sum, b) => sum + b.width * 2, 0);
    const totalHeight = config.rows * config.blockSize + (config.sashing.width * (config.rows - 1)) + config.borders.reduce((sum, b) => sum + b.width * 2, 0);
    setCanvasWidth(totalWidth);
    setCanvasHeight(totalHeight);
    setGridEnabled(true);
    setGridSize(1);
    setSnapToGrid(true);
    setActiveTab('blank');
  };

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsCreating(true);

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || 'Untitled Quilt',
          unitSystem,
          canvasWidth,
          canvasHeight,
          gridSettings: { enabled: gridEnabled, size: gridSize, snapToGrid },
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent('/dashboard')}`;
          return;
        }

        try {
          const data = await res.json();
          setError(data.error ?? 'Failed to create project');
        } catch {
          setError('Failed to create project');
        }
        setIsCreating(false);
        return;
      }

      const data = await res.json();
      onClose();
      router.push(`/studio/${data.data.id}`);
    } catch {
      setError('Failed to create project');
      setIsCreating(false);
    }
  }

  const unitLabel = unitSystem === 'imperial' ? 'in' : 'cm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-md rounded-xl bg-surface shadow-elevation-3 p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold text-on-surface mb-4">New Project</h2>

        {error && (
          <div className="mb-4 rounded-sm bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="flex gap-1 mb-6 bg-surface-container rounded-lg p-1">
          <button
            type="button"
            onClick={() => setActiveTab('blank')}
            className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'blank'
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Blank
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'layout'
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Layout
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`flex-1 px-2 py-2 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'template'
                ? 'bg-surface text-on-surface shadow-sm'
                : 'text-secondary hover:text-on-surface'
            }`}
          >
            Template
          </button>
        </div>

        {activeTab === 'template' ? (
          <div className="space-y-4">
            <ProjectTemplates onSelectTemplate={handleSelectTemplate} showCreateButton={false} />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2.5 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : activeTab === 'layout' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              {LAYOUT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectLayoutPreset(preset)}
                  className="flex items-center gap-3 rounded-lg bg-surface-container px-4 py-3 text-left transition-colors hover:bg-surface-container-high group"
                >
                  <div className="w-8 h-8 bg-primary/20 rounded flex items-center justify-center shrink-0">
                    <div className={`grid gap-0.5 ${preset.config.rows <= 3 ? 'grid-cols-3' : preset.config.rows === 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
                      {Array.from({ length: preset.config.rows * preset.config.cols }).map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-primary rounded-sm" />
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-on-surface">{preset.name}</p>
                    <p className="text-xs text-secondary">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-4 py-2.5 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {onBrowsePatterns && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onBrowsePatterns();
                }}
                className="w-full mb-4 flex items-center gap-3 rounded-lg bg-surface-container px-4 py-3.5 text-left transition-colors hover:bg-surface-container-high group"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="shrink-0 text-primary"
                >
                  <rect
                    x="3"
                    y="3"
                    width="8"
                    height="8"
                    rx="1.5"
                    fill="currentColor"
                    opacity="0.7"
                  />
                  <rect
                    x="13"
                    y="3"
                    width="8"
                    height="8"
                    rx="1.5"
                    fill="currentColor"
                    opacity="0.4"
                  />
                  <rect
                    x="3"
                    y="13"
                    width="8"
                    height="8"
                    rx="1.5"
                    fill="currentColor"
                    opacity="0.4"
                  />
                  <rect
                    x="13"
                    y="13"
                    width="8"
                    height="8"
                    rx="1.5"
                    fill="currentColor"
                    opacity="0.7"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                    Start from Pattern
                  </p>
                  <p className="text-xs text-secondary">Choose from our pattern library</p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="ml-auto text-secondary"
                >
                  <path
                    d="M6 3l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label
                  htmlFor="project-name"
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  Project Name
                </label>
                <input
                  id="project-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={255}
                  className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary mb-2">Unit System</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUnitSystem('imperial')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      unitSystem === 'imperial'
                        ? 'bg-primary text-primary-on'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    Imperial (inches)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitSystem('metric')}
                    className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      unitSystem === 'metric'
                        ? 'bg-primary text-primary-on'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    Metric (cm)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="canvas-width"
                    className="block text-sm font-medium text-secondary mb-1"
                  >
                    Width ({unitLabel})
                  </label>
                  <input
                    id="canvas-width"
                    type="number"
                    min={1}
                    max={200}
                    step={0.25}
                    value={canvasWidth}
                    onChange={(e) => setCanvasWidth(Number(e.target.value))}
                    className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label
                    htmlFor="canvas-height"
                    className="block text-sm font-medium text-secondary mb-1"
                  >
                    Height ({unitLabel})
                  </label>
                  <input
                    id="canvas-height"
                    type="number"
                    min={1}
                    max={200}
                    step={0.25}
                    value={canvasHeight}
                    onChange={(e) => setCanvasHeight(Number(e.target.value))}
                    className="w-full rounded-sm border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-outline-variant pt-4">
                <h3 className="text-sm font-medium text-secondary">Grid Settings</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gridEnabled}
                    onChange={(e) => setGridEnabled(e.target.checked)}
                    className="rounded accent-primary"
                  />
                  <span className="text-sm text-secondary">Show grid</span>
                </label>
                {gridEnabled && (
                  <>
                    <div>
                      <label htmlFor="grid-size" className="block text-xs text-secondary mb-1">
                        Grid size ({unitLabel})
                      </label>
                      <input
                        id="grid-size"
                        type="number"
                        min={0.25}
                        max={12}
                        step={0.25}
                        value={gridSize}
                        onChange={(e) => setGridSize(Number(e.target.value))}
                        className="w-24 rounded-sm border border-outline-variant bg-surface px-3 py-1.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={snapToGrid}
                        onChange={(e) => setSnapToGrid(e.target.checked)}
                        className="rounded accent-primary"
                      />
                      <span className="text-sm text-secondary">Snap to grid</span>
                    </label>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md px-4 py-2.5 text-sm font-medium text-secondary hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-on hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
