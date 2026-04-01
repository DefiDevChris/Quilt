'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useBlockStore } from '@/stores/blockStore';
import { useToast } from '@/components/ui/ToastProvider';
import {
  extractPolygons,
  generateVariations,
  variationToSvg,
  multiPolygonToFabricData,
  type GeneratedVariation,
} from '@/lib/serendipity-utils';
import { sanitizeSvg } from '@/lib/sanitize-svg';
import type { BlockListItem } from '@/types/block';

interface SerendipityToolProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SerendipityTool({ isOpen, onClose }: SerendipityToolProps) {
  const [blockA, setBlockA] = useState<BlockListItem | null>(null);
  const [blockB, setBlockB] = useState<BlockListItem | null>(null);
  const [variations, setVariations] = useState<GeneratedVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState<'A' | 'B' | null>(null);

  const { toast } = useToast();
  const blocks = useBlockStore((s) => s.blocks);
  const userBlocks = useBlockStore((s) => s.userBlocks);
  const allBlocks = useMemo(
    () =>
      [...blocks, ...userBlocks].filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i),
    [blocks, userBlocks]
  );

  // Fetch block data when both blocks are selected
  useEffect(() => {
    if (!blockA || !blockB) {
      setVariations([]);
      return;
    }

    // Capture current values before async
    const currentA = blockA;
    const currentB = blockB;
    let cancelled = false;

    async function fetchAndGenerate() {
      setIsGenerating(true);

      try {
        const [resA, resB] = await Promise.all([
          fetch(`/api/blocks/${currentA.id}`),
          fetch(`/api/blocks/${currentB.id}`),
        ]);

        if (cancelled) return;

        if (!resA.ok || !resB.ok) {
          setIsGenerating(false);
          return;
        }

        const dataA = await resA.json();
        const dataB = await resB.json();

        if (cancelled) return;

        const fabricDataA = dataA.data?.fabricJsData ?? {};
        const fabricDataB = dataB.data?.fabricJsData ?? {};

        const geoA = extractPolygons(currentA.id, currentA.name, fabricDataA);
        const geoB = extractPolygons(currentB.id, currentB.name, fabricDataB);
        const vars = generateVariations(geoA, geoB);

        if (!cancelled) {
          setVariations(vars);
        }
      } catch {
        toast({
          type: 'error',
          title: 'Generation failed',
          description: 'Could not generate variations. Please try again.',
        });
      } finally {
        if (!cancelled) setIsGenerating(false);
      }
    }

    fetchAndGenerate();
    return () => {
      cancelled = true;
    };
  }, [blockA, blockB]);

  const handleSaveToLibrary = useCallback(async (variation: GeneratedVariation) => {
    setIsSaving(true);

    try {
      const fabricData = multiPolygonToFabricData(
        variation.polygons,
        `${variation.parentBlockNames[0]} x ${variation.parentBlockNames[1]} (${variation.label})`,
        variation.parentBlockIds
      );

      const svgContent = variationToSvg(variation);

      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${variation.parentBlockNames[0]} x ${variation.parentBlockNames[1]} (${variation.label})`,
          category: 'Generated',
          svgData: svgContent,
          fabricJsData: fabricData,
          tags: ['generated', 'serendipity', variation.type],
          parentBlockIds: variation.parentBlockIds,
        }),
      });

      if (res.ok) {
        useBlockStore.getState().fetchUserBlocks();
        toast({
          type: 'success',
          title: 'Block saved',
          description: 'The variation has been added to your library.',
        });
      } else {
        throw new Error('Save failed');
      }
    } catch {
      toast({
        type: 'error',
        title: 'Save failed',
        description: 'Could not save the variation. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleAddToCanvas = useCallback(
    async (variation: GeneratedVariation) => {
      const canvas = useCanvasStore.getState().fabricCanvas;
      if (!canvas) return;

      try {
        const fabric = await import('fabric');
        const fabricCanvas = canvas as InstanceType<typeof fabric.Canvas>;

        // Push undo state before adding
        const currentJson = JSON.stringify(fabricCanvas.toJSON());
        useCanvasStore.getState().pushUndoState(currentJson);

        const svgPath = variation.svgPath;
        if (!svgPath) return;

        const path = new fabric.Path(svgPath, {
          left: 50,
          top: 50,
          fill: '#D4883C',
          stroke: '#2D2D2D',
          strokeWidth: 1,
          scaleX: 1,
          scaleY: 1,
        });

        fabricCanvas.add(path);
        fabricCanvas.setActiveObject(path);
        fabricCanvas.requestRenderAll();

        onClose();
        toast({
          type: 'success',
          title: 'Added to canvas',
          description: 'The variation has been added to your design.',
        });
      } catch {
        toast({
          type: 'error',
          title: 'Add failed',
          description: 'Could not add the variation to canvas. Please try again.',
        });
      }
    },
    [onClose, toast]
  );

  const handleSelectBlock = useCallback(
    (block: BlockListItem) => {
      if (selectingSlot === 'A') {
        setBlockA(block);
      } else if (selectingSlot === 'B') {
        setBlockB(block);
      }
      setSelectingSlot(null);
    },
    [selectingSlot]
  );

  if (!isOpen) return null;

  // Block selector sub-view
  if (selectingSlot) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
        <div className="w-full max-w-lg rounded-xl bg-surface shadow-elevation-3 p-6 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-on-surface">Select Block {selectingSlot}</h2>
            <button
              type="button"
              onClick={() => setSelectingSlot(null)}
              className="text-secondary hover:text-on-surface"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto flex-1 grid grid-cols-4 gap-2">
            {allBlocks
              .filter((b) => !b.isLocked)
              .map((block) => (
                <button
                  key={block.id}
                  type="button"
                  onClick={() => handleSelectBlock(block)}
                  className={`rounded-lg border-2 p-2 text-center transition-colors hover:border-primary ${
                    (selectingSlot === 'A' && blockA?.id === block.id) ||
                    (selectingSlot === 'B' && blockB?.id === block.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant'
                  }`}
                >
                  <div className="w-full aspect-square bg-background rounded flex items-center justify-center mb-1">
                    {block.thumbnailUrl ? (
                      <img
                        src={block.thumbnailUrl}
                        alt={block.name}
                        className="w-full h-full object-contain rounded"
                      />
                    ) : (
                      <span className="text-2xl text-secondary">◇</span>
                    )}
                  </div>
                  <div className="text-[10px] text-secondary truncate">{block.name}</div>
                </button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/40">
      <div className="w-full max-w-lg rounded-xl bg-surface shadow-elevation-3 p-6">
        <h2 className="text-lg font-semibold text-on-surface mb-2">Serendipity Block Generator</h2>
        <p className="text-xs text-secondary mb-4">
          Combine two blocks to discover unique new designs using boolean geometry operations.
        </p>

        {/* Block Selection */}
        <div className="flex gap-4 mb-6">
          <BlockSlot
            label="Block A"
            block={blockA}
            onSelect={() => setSelectingSlot('A')}
            onClear={() => setBlockA(null)}
          />
          <div className="flex items-center text-2xl text-secondary">×</div>
          <BlockSlot
            label="Block B"
            block={blockB}
            onSelect={() => setSelectingSlot('B')}
            onClear={() => setBlockB(null)}
          />
        </div>

        {/* Generation Status */}
        {isGenerating && (
          <div className="text-center py-6">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs text-secondary">Generating variations...</p>
          </div>
        )}

        {/* Variation Previews */}
        {!isGenerating && variations.length > 0 && (
          <div className="space-y-3 mb-4">
            <label className="block text-xs font-medium text-secondary uppercase tracking-wider">
              Variations ({variations.length})
            </label>
            <div className="grid grid-cols-2 gap-3">
              {variations.map((variation) => (
                <VariationCard
                  key={variation.type}
                  variation={variation}
                  onSave={() => handleSaveToLibrary(variation)}
                  onAdd={() => handleAddToCanvas(variation)}
                  isSaving={isSaving}
                />
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!isGenerating && blockA && blockB && variations.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-secondary">
              No variations could be generated. Try selecting blocks with overlapping geometry.
            </p>
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-outline-variant px-4 py-2 text-sm text-secondary hover:bg-background transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function BlockSlot({
  label,
  block,
  onSelect,
  onClear,
}: {
  label: string;
  block: BlockListItem | null;
  onSelect: () => void;
  onClear: () => void;
}) {
  return (
    <div className="flex-1">
      <label className="block text-xs font-medium text-secondary mb-1">{label}</label>
      {block ? (
        <div className="rounded-lg border-2 border-primary bg-primary/5 p-2 relative">
          <div className="w-full aspect-square bg-background rounded flex items-center justify-center mb-1">
            {block.thumbnailUrl ? (
              <img
                src={block.thumbnailUrl}
                alt={block.name}
                className="w-full h-full object-contain rounded"
              />
            ) : (
              <span className="text-3xl text-secondary">◇</span>
            )}
          </div>
          <div className="text-xs text-on-surface truncate text-center">{block.name}</div>
          <button
            type="button"
            onClick={onClear}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-error text-white text-xs flex items-center justify-center hover:opacity-80"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className="w-full rounded-lg border-2 border-dashed border-outline-variant p-4 text-center hover:border-primary-container transition-colors"
        >
          <div className="text-2xl text-secondary mb-1">+</div>
          <div className="text-xs text-secondary">Select Block</div>
        </button>
      )}
    </div>
  );
}

function VariationCard({
  variation,
  onSave,
  onAdd,
  isSaving,
}: {
  variation: GeneratedVariation;
  onSave: () => void;
  onAdd: () => void;
  isSaving: boolean;
}) {
  const svgString = variationToSvg(variation);

  return (
    <div className="rounded-lg border border-outline-variant p-2">
      <div
        className="w-full aspect-square bg-background rounded mb-2 flex items-center justify-center"
        dangerouslySetInnerHTML={{ __html: sanitizeSvg(svgString) }}
      />
      <div className="text-[10px] text-on-surface font-medium mb-2 truncate">{variation.label}</div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex-1 rounded-md bg-primary/10 px-2 py-1 text-[10px] text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="flex-1 rounded-md bg-primary px-2 py-1 text-[10px] text-white hover:opacity-90 transition-opacity"
        >
          Add
        </button>
      </div>
    </div>
  );
}
