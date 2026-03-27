'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSketchbookStore } from '@/stores/sketchbookStore';
import { useProjectStore } from '@/stores/projectStore';

interface SketchbookPanelProps {
  onSwitchVariation: (canvasData: Record<string, unknown>) => void;
  getCurrentCanvasData: () => Record<string, unknown>;
}

export function SketchbookPanel({
  onSwitchVariation,
  getCurrentCanvasData,
}: SketchbookPanelProps) {
  const isPanelOpen = useSketchbookStore((s) => s.isPanelOpen);
  const variations = useSketchbookStore((s) => s.variations);
  const activeVariationId = useSketchbookStore((s) => s.activeVariationId);
  const isLoading = useSketchbookStore((s) => s.isLoading);
  const isSaving = useSketchbookStore((s) => s.isSaving);
  const compareMode = useSketchbookStore((s) => s.compareMode);
  const compareVariationId = useSketchbookStore((s) => s.compareVariationId);
  const loadVariations = useSketchbookStore((s) => s.loadVariations);
  const saveVariation = useSketchbookStore((s) => s.saveVariation);
  const deleteVariation = useSketchbookStore((s) => s.deleteVariation);
  const duplicateVariation = useSketchbookStore((s) => s.duplicateVariation);
  const renameVariation = useSketchbookStore((s) => s.renameVariation);
  const setActiveVariation = useSketchbookStore((s) => s.setActiveVariation);
  const setCompareMode = useSketchbookStore((s) => s.setCompareMode);

  const projectId = useProjectStore((s) => s.projectId);

  const [newName, setNewName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    if (isPanelOpen && projectId) {
      loadVariations(projectId);
    }
  }, [isPanelOpen, projectId, loadVariations]);

  const handleSave = useCallback(() => {
    if (!projectId) return;
    const name = newName.trim() || `Variation ${variations.length + 1}`;
    const canvasData = getCurrentCanvasData();
    saveVariation(projectId, name, canvasData);
    setNewName('');
  }, [projectId, newName, variations.length, getCurrentCanvasData, saveVariation]);

  const handleSwitch = useCallback(
    (variationId: string) => {
      const variation = variations.find((v) => v.id === variationId);
      if (!variation) return;
      setActiveVariation(variationId);
      onSwitchVariation(variation.canvasData);
    },
    [variations, setActiveVariation, onSwitchVariation]
  );

  const handleDelete = useCallback(
    (variationId: string) => {
      if (!projectId) return;
      deleteVariation(projectId, variationId);
    },
    [projectId, deleteVariation]
  );

  const handleDuplicate = useCallback(
    (variationId: string) => {
      if (!projectId) return;
      duplicateVariation(projectId, variationId);
    },
    [projectId, duplicateVariation]
  );

  const handleRenameSubmit = useCallback(
    (variationId: string) => {
      if (!projectId || !renameValue.trim()) return;
      renameVariation(projectId, variationId, renameValue.trim());
      setRenamingId(null);
      setRenameValue('');
    },
    [projectId, renameValue, renameVariation]
  );

  const handleCompareToggle = useCallback(
    (variationId: string) => {
      if (compareMode && compareVariationId === variationId) {
        setCompareMode(false);
      } else {
        setCompareMode(true, variationId);
      }
    },
    [compareMode, compareVariationId, setCompareMode]
  );

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed right-0 top-12 bottom-0 z-40 w-[300px] bg-surface border-l border-outline-variant shadow-elevation-2 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant">
            <h3 className="text-sm font-semibold text-on-surface">
              Sketchbook
              {variations.length > 0 && (
                <span className="ml-1 text-xs text-secondary">({variations.length})</span>
              )}
            </h3>
            <button
              type="button"
              onClick={() => useSketchbookStore.getState().setPanelOpen(false)}
              className="text-secondary hover:text-on-surface text-sm"
            >
              Close
            </button>
          </div>

          {/* Save New */}
          <div className="px-4 py-3 border-b border-outline-variant">
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Variation name..."
                maxLength={255}
                className="flex-1 rounded-sm border border-outline-variant bg-surface px-2 py-1 text-xs text-on-surface placeholder:text-secondary focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-sm bg-primary px-3 py-1 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Variations List */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
            {isLoading && (
              <div className="py-8 text-center text-xs text-secondary">Loading...</div>
            )}

            {!isLoading && variations.length === 0 && (
              <div className="py-8 text-center text-xs text-secondary">
                No saved variations yet. Save your current design to get started.
              </div>
            )}

            <div className="space-y-2">
              {variations.map((variation) => (
                <div
                  key={variation.id}
                  className={`rounded-md border p-2 cursor-pointer transition-colors ${
                    activeVariationId === variation.id
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant hover:bg-background'
                  } ${
                    compareMode && compareVariationId === variation.id
                      ? 'ring-2 ring-primary/40'
                      : ''
                  }`}
                >
                  {/* Name / Rename */}
                  {renamingId === variation.id ? (
                    <div className="flex gap-1 mb-1">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameSubmit(variation.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        maxLength={255}
                        className="flex-1 rounded-sm border border-outline-variant bg-surface px-1.5 py-0.5 text-xs text-on-surface focus:border-primary focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleRenameSubmit(variation.id)}
                        className="text-xs text-primary"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div
                      className="text-xs font-medium text-on-surface mb-1 truncate"
                      onClick={() => handleSwitch(variation.id)}
                    >
                      {variation.name}
                    </div>
                  )}

                  <div className="text-[10px] text-secondary mb-1">
                    {variation.createdAt.toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleSwitch(variation.id)}
                      className="rounded px-1.5 py-0.5 text-[10px] bg-background text-secondary hover:bg-outline-variant"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicate(variation.id)}
                      className="rounded px-1.5 py-0.5 text-[10px] bg-background text-secondary hover:bg-outline-variant"
                    >
                      Duplicate
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(variation.id);
                        setRenameValue(variation.name);
                      }}
                      className="rounded px-1.5 py-0.5 text-[10px] bg-background text-secondary hover:bg-outline-variant"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCompareToggle(variation.id)}
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        compareMode && compareVariationId === variation.id
                          ? 'bg-primary text-white'
                          : 'bg-background text-secondary hover:bg-outline-variant'
                      }`}
                    >
                      Compare
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(variation.id)}
                      className="rounded px-1.5 py-0.5 text-[10px] bg-background text-error hover:bg-error/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
