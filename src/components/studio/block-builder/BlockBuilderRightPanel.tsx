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
 * Block Builder right panel — matches the screenshot layout exactly:
 * Tabs (Block Info / Block Library) → Block Name → Block Size → Instructions → Save
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
  const [activeTab, setActiveTab] = useState<'info' | 'library'>('info');

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const systemBlocks = blocks.filter((b) => b.isDefault);

  return (
    <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-surface border-l border-outline-variant/15 overflow-hidden">
      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex border-b border-outline-variant/40 flex-shrink-0">
        <TabButton
          label="Block Info"
          active={activeTab === 'info'}
          onClick={() => setActiveTab('info')}
        />
        <TabButton
          label="Block Library"
          active={activeTab === 'library'}
          onClick={() => setActiveTab('library')}
        />
      </div>

      {activeTab === 'info' ? (
        /* ── Block Info ──────────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Block Name */}
          <div>
            <label className="block text-xs font-medium text-on-surface mb-1.5">Block Name</label>
            <input
              type="text"
              value={blockName}
              onChange={(e) => onBlockNameChange(e.target.value)}
              placeholder="My Block"
              maxLength={100}
              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface placeholder:text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Block Size */}
          <div>
            <label className="block text-xs font-medium text-on-surface mb-2">Block Size</label>
            <div className="flex flex-wrap gap-2">
              {STANDARD_BLOCK_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => onBlockSizeChange(size)}
                  className={`w-10 h-8 rounded-full text-xs font-bold transition-all ${blockSize === size
                      ? 'bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-1'
                      : 'bg-surface-container text-secondary hover:bg-surface-container-high'
                    }`}
                >
                  {size}″
                </button>
              ))}
            </div>
            <p className="text-[11px] text-secondary mt-1.5 leading-relaxed">
              Your block will be {blockSize}″ × {blockSize}″. You can scale it to other sizes when placed in a quilt.
            </p>
          </div>

          {/* Instructions */}
          <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/15">
            <p className="text-xs font-semibold text-primary mb-1.5">How to build a block</p>
            <ol className="text-[11px] text-secondary space-y-1 leading-relaxed">
              <li>1. Use the drawing tools on the left to create shapes</li>
              <li>2. Drag rectangles and triangles onto the grid</li>
              <li>3. Select shapes to move, resize, or delete them</li>
              <li>4. Name your block and click Save when done</li>
            </ol>
          </div>

          {/* Save Block */}
          <button
            type="button"
            onClick={onSave}
            className="w-full rounded-full py-3 text-sm font-bold bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-2 hover:shadow-elevation-3 transition-all"
          >
            Save Block
          </button>
        </div>
      ) : (
        /* ── Block Library ───────────────────────────────────────── */
        <div className="flex-1 overflow-y-auto p-4">
          {systemBlocks.length === 0 ? (
            <p className="text-xs text-secondary text-center py-8">No system blocks loaded.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {systemBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex flex-col items-center p-2 rounded-lg bg-surface-container border border-outline-variant/30"
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-surface flex items-center justify-center mb-1">
                    {block.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={block.thumbnailUrl} alt={block.name} className="w-full h-full object-contain" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-secondary opacity-40">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    )}
                  </div>
                  <span className="text-[9px] font-medium text-on-surface text-center leading-tight truncate w-full">
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

function TabButton({
  label,
  active,
  onClick,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${active
          ? 'text-primary border-b-2 border-primary'
          : 'text-secondary hover:text-on-surface'
        }`}
    >
      {label}
    </button>
  );
}
