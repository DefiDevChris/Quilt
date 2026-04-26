'use client';

import dynamic from 'next/dynamic';
import { useProjectStore } from '@/stores/projectStore';
import { useLayoutStore } from '@/stores/layoutStore';
import StudioTopBar from './StudioTopBar';
import Toolbar from './Toolbar';
import StudioDropZone from './StudioDropZone';
import SaveAsTemplateModal from './SaveAsTemplateModal';
import { useState, useEffect, useRef } from 'react';
import { inchesToPixels } from '@/lib/layout-size-utils';

// Dynamically import Fabric.js canvas wrapper to avoid SSR issues
const FabricCanvas = dynamic(() => import('./FabricCanvas').catch(() => {
  // Fallback if FabricCanvas doesn't exist yet
  const Fallback = () => <div className="w-full h-full bg-gray-50 flex items-center justify-center text-muted-foreground text-sm">Canvas loading…</div>;
  Fallback.displayName = 'FabricCanvasFallback';
  return { default: Fallback };
}), { ssr: false });

export default function StudioLayout() {
  const { mode, width, height } = useProjectStore();
  const { clearAllFabrics } = useLayoutStore();
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const canvasWidthPx = inchesToPixels(width ?? 60);
  const canvasHeightPx = inchesToPixels(height ?? 80);

  async function handleSaveAsTemplate(name: string) {
    // Serialize the canvas to JSON (if fabric canvas is mounted)
    const canvasJson = canvasRef.current
      ? JSON.stringify((canvasRef.current as unknown as { toJSON: () => object }).toJSON?.())
      : null;

    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        canvas_json: canvasJson,
        width_in: width,
        height_in: height,
      }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      throw new Error(error ?? 'Failed to save template');
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top bar */}
      <StudioTopBar
        onSaveAsTemplate={() => setSaveModalOpen(true)}
        onClearFabrics={mode === 'template' ? clearAllFabrics : undefined}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left toolbar */}
        <Toolbar side="left" mode={mode ?? 'freeform'} />

        {/* Canvas area */}
        <StudioDropZone>
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-100"
          >
            <div
              style={{ width: canvasWidthPx, height: canvasHeightPx }}
              className="shadow-lg bg-white"
            >
              <FabricCanvas
                width={canvasWidthPx}
                height={canvasHeightPx}
                canvasRef={canvasRef}
              />
            </div>
          </div>
        </StudioDropZone>

        {/* Right toolbar */}
        <Toolbar side="right" mode={mode ?? 'freeform'} />
      </div>

      {/* Save as template modal */}
      <SaveAsTemplateModal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        onSave={handleSaveAsTemplate}
      />
    </div>
  );
}
