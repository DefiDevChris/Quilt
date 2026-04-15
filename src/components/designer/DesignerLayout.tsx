'use client';

/**
 * DesignerLayout — The simplified quilt designer workspace
 *
 * Three-panel layout:
 * - Left sidebar (250px): MyBlocksPanel — uploaded block images
 * - Center (flex): DesignerCanvasWorkspace — Fabric.js canvas with designer hooks
 * - Right sidebar (280px): SashingBorderPanel — sashing + border config
 *
 * Simplified from StudioLayout — no tool palette, no reference photo pane,
 * no minimap, no smart guides, no complex layout types.
 */

import { useRef, useEffect, useState } from 'react';
import type { Project } from '@/types/project';
import { COLORS } from '@/lib/design-system';
import { MyBlocksPanel } from '@/components/designer/MyBlocksPanel';
import { DesignerCanvasWorkspace } from '@/components/designer/DesignerCanvasWorkspace';
import { SashingBorderPanel } from '@/components/designer/SashingBorderPanel';
import { ExportButton } from '@/components/designer/ExportButton';
import { useDesignerAutoSave } from '@/hooks/useDesignerAutoSave';
import { useCanvasContext } from '@/contexts/CanvasContext';

interface DesignerLayoutProps {
  readonly project: Project;
}

function DesignerTopBar({ project, fabricCanvas }: { project: Project; fabricCanvas: unknown }) {
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    const handleSaveSuccess = () => setSaveStatus('saved');
    const handleSaveError = () => setSaveStatus('error');

    window.addEventListener('quiltcorgi:designer-save-success', handleSaveSuccess);
    window.addEventListener('quiltcorgi:designer-save-error', handleSaveError);

    return () => {
      window.removeEventListener('quiltcorgi:designer-save-success', handleSaveSuccess);
      window.removeEventListener('quiltcorgi:designer-save-error', handleSaveError);
    };
  }, []);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--color-border)]/20 bg-[var(--color-surface)]">
      <h1 className="text-[16px] leading-[24px] font-semibold text-[var(--color-text)] truncate">
        {project.name}
      </h1>
      <div className="flex items-center gap-2">
        {saveStatus === 'saved' && <span className="text-xs text-green-600">Saved</span>}
        {saveStatus === 'error' && (
          <span className="text-xs text-[var(--color-primary)]">Save failed</span>
        )}
        <ExportButton fabricCanvas={fabricCanvas} projectName={project.name} />
      </div>
    </div>
  );
}

function DesignerLayoutInner({ project }: DesignerLayoutProps) {
  const { getCanvas } = useCanvasContext();
  const fabricCanvas = getCanvas();

  // Auto-save for Pro users
  useDesignerAutoSave({
    fabricCanvas,
    projectId: project.id,
  });

  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)] select-none">
      {/* Top bar */}
      <DesignerTopBar project={project} fabricCanvas={fabricCanvas} />

      {/* Three-panel workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar: My Blocks panel */}
        <div
          className="w-[250px] border-r border-[var(--color-border)]/20 bg-[var(--color-surface)] flex flex-col overflow-hidden"
          style={{ boxShadow: `1px 0 0 ${COLORS.border}20` }}
        >
          <MyBlocksPanel />
        </div>

        {/* Center: Canvas workspace */}
        <div className="flex-1 flex flex-col overflow-hidden relative bg-[var(--color-bg)]">
          <DesignerCanvasWorkspace project={project} />
        </div>

        {/* Right sidebar: Sashing & Border panel */}
        <div
          className="w-[280px] border-l border-[var(--color-border)]/20 bg-[var(--color-surface)] flex flex-col overflow-hidden"
          style={{ boxShadow: `-1px 0 0 ${COLORS.border}20` }}
        >
          <div className="px-4 py-3 border-b border-[var(--color-border)]/15">
            <h2 className="text-[14px] leading-[20px] font-semibold text-[var(--color-text)]">
              Sashing & Borders
            </h2>
          </div>
          <SashingBorderPanel />
        </div>
      </div>
    </div>
  );
}

export function DesignerLayout({ project }: DesignerLayoutProps) {
  return <DesignerLayoutInner project={project} />;
}
