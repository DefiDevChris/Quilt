'use client';

import { useEffect, useState } from 'react';
import { useBlockStore } from '@/stores/blockStore';
import { STANDARD_BLOCK_SIZES } from '@/lib/quilt-sizing';

interface BlockBuilderRightPanelProps {
  readonly blockName: string;
  readonly onBlockNameChange: (name: string) => void;
  readonly blockSize: number;
  readonly onBlockSizeChange: (size: number) => void;
  readonly onSave: () => void;
  readonly selectedObject: object | null;
  readonly fabricCanvasRef: React.MutableRefObject<unknown>;
}

/**
 * Block Builder right panel.
 * TOP: Block Library — system blocks shown for reference (user can look at
 *   existing block designs while drafting their own).
 * BOTTOM: Block Info — name input, shape dimensions, Save Block button.
 */
export function BlockBuilderRightPanel({
  blockName,
  onBlockNameChange,
  blockSize,
  onBlockSizeChange,
  onSave,
  selectedObject,
}: BlockBuilderRightPanelProps) {
  const blocks = useBlockStore((s) => s.blocks);
  const fetchBlocks = useBlockStore((s) => s.fetchBlocks);
  const [activeTab, setActiveTab] = useState<'library' | 'info'>('info');

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const systemBlocks = blocks.filter((b) => b.isDefault);

  return (
    <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-surface border-l border-outline-variant/15 overflow-hidden">
      {/* Tab toggle */}
      <div className="flex border-b border-outline-variant/40 flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'info'
            ? 'border-b-2 border-primary text-primary'
            : 'text-on-surface/60 hover:text-on-surface'
            }`}
        >
          Block Info
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('library')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${activeTab === 'library'
            ? 'border-b-2 border-primary text-primary'
            : 'text-on-surface/60 hover:text-on-surface'
            }`}
        >
          Block Library
        </button>
      </div>

      {activeTab === 'info' ? (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Block name */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Block Name</label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => onBlockNameChange(e.target.value)}
              placeholder="My Block"
              maxLength={100}
              className="w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Block size */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">Block Size</label>
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_BLOCK_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onBlockSizeChange(size)}
                  className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition-all ${blockSize === size
                      ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                      : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                    }`}
                >
                  {size}″
                </button>
              ))}
            </div>
            <p className="text-[10px] text-secondary mt-1">
              Your block will be {blockSize}″ × {blockSize}″. You can scale it to other sizes when placed in a quilt.
            </p>
          </div>

          {/* Shape dimensions */}
          {selectedObject != null && (
            <div className="p-2 bg-surface-container rounded-lg">
              <p className="text-[10px] text-secondary mb-1">Selected Shape</p>
              <p className="text-xs text-on-surface font-mono">
                {Math.round((selectedObject as { width?: number }).width ?? 0)} ×{' '}
                {Math.round((selectedObject as { height?: number }).height ?? 0)} px
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/20">
            <p className="text-xs font-medium text-primary mb-1">How to build a block</p>
            <ol className="text-[11px] text-secondary space-y-0.5 list-decimal list-inside">
              <li>Use the drawing tools on the left to create shapes</li>
              <li>Drag rectangles and triangles onto the grid</li>
              <li>Select shapes to move, resize, or delete them</li>
              <li>Name your block and click Save when done</li>
            </ol>
          </div>

          {/* Save button */}
          <button
            type="button"
            onClick={onSave}
            className="w-full rounded-xl px-4 py-3 text-sm font-bold bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1 hover:shadow-elevation-2 transition-all"
          >
            Save Block
          </button>
        </div>
      ) : (
        /* Block Library — system blocks for reference */
        <div className="flex-1 overflow-y-auto p-3">
          {systemBlocks.length === 0 ? (
            <p className="text-xs text-secondary text-center py-8">No system blocks loaded.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {systemBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex flex-col items-center p-2 rounded-lg bg-surface-container border border-outline-variant/30"
                >
                  <div className="w-12 h-12 rounded-md overflow-hidden bg-surface flex items-center justify-center mb-1">
                    {block.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={block.thumbnailUrl}
                        alt={block.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-secondary opacity-40">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-on-surface text-center leading-tight truncate w-full">
                    {block.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
