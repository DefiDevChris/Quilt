'use client';

import { useEffect, useState } from 'react';
import { useBlockStore } from '@/stores/blockStore';
import { STANDARD_BLOCK_SIZES } from '@/lib/quilt-sizing';

interface BlockPieceDef {
  id: string;
  name: string;
  description: string;
  fill: string;
  createShape: (
    fabric: typeof import('fabric'),
    canvasSize: number
  ) => unknown;
}

interface BlockBuilderRightPanelProps {
  readonly blockName: string;
  readonly onBlockNameChange: (name: string) => void;
  readonly blockSize: number;
  readonly onBlockSizeChange: (size: number) => void;
  readonly onSave: () => void;
  readonly selectedObject: object | null;
}

/** Common quilt block pieces that can be dragged onto the canvas. */
export const BLOCK_PIECES: BlockPieceDef[] = [
  {
    id: 'hst',
    name: 'Half-Square Triangle',
    description: 'Two triangles forming a square',
    fill: 'rgba(180, 140, 100, 0.15)',
    createShape(fabric, canvasSize) {
      const half = canvasSize / 2;
      const path = new fabric.Path(`M 0 0 L ${half} ${half} L 0 ${half} Z`, {
        fill: 'rgba(180, 140, 100, 0.2)',
        stroke: '#333',
        strokeWidth: 1.5,
        selectable: true,
        evented: true,
      });
      (path as unknown as Record<string, unknown>)['_blockBuilderShape'] = true;
      return path;
    },
  },
  {
    id: 'qst',
    name: 'Quarter-Square Triangle',
    description: 'Four triangles forming a square',
    fill: 'rgba(140, 170, 130, 0.15)',
    createShape(fabric, canvasSize) {
      const q = canvasSize / 4;
      const h = canvasSize / 2;
      const path = new fabric.Path(
        `M 0 0 L ${h} 0 L ${h} ${h} L 0 ${h} Z M ${q} ${q} L ${h} ${q} L ${h} ${h} L ${q} ${h} Z`,
        {
          fill: 'rgba(140, 170, 130, 0.2)',
          stroke: '#333',
          strokeWidth: 1.5,
          selectable: true,
          evented: true,
        }
      );
      (path as unknown as Record<string, unknown>)['_blockBuilderShape'] = true;
      return path;
    },
  },
  {
    id: 'flying-geese',
    name: 'Flying Geese',
    description: 'One large triangle with two small flanking triangles',
    fill: 'rgba(130, 160, 200, 0.15)',
    createShape(fabric, canvasSize) {
      const w = canvasSize;
      const h = canvasSize;
      const halfW = w / 2;
      const halfH = h / 2;
      const path = new fabric.Path(
        `M ${halfW} 0 L ${w} ${h} L 0 ${h} Z`,
        {
          fill: 'rgba(130, 160, 200, 0.25)',
          stroke: '#333',
          strokeWidth: 1.5,
          selectable: true,
          evented: true,
        }
      );
      (path as unknown as Record<string, unknown>)['_blockBuilderShape'] = true;
      return path;
    },
  },
  {
    id: 'square',
    name: 'Square',
    description: 'Basic square piece',
    fill: 'rgba(160, 130, 180, 0.15)',
    createShape(fabric, canvasSize) {
      const rect = new fabric.Rect({
        left: 0,
        top: 0,
        width: canvasSize / 2,
        height: canvasSize / 2,
        fill: 'rgba(160, 130, 180, 0.2)',
        stroke: '#333',
        strokeWidth: 1.5,
        selectable: true,
        evented: true,
      });
      (rect as unknown as Record<string, unknown>)['_blockBuilderShape'] = true;
      return rect;
    },
  },
  {
    id: 'rectangle',
    name: 'Rectangle',
    description: 'Basic rectangular piece',
    fill: 'rgba(200, 150, 120, 0.15)',
    createShape(fabric, canvasSize) {
      const rect = new fabric.Rect({
        left: 0,
        top: 0,
        width: canvasSize,
        height: canvasSize / 3,
        fill: 'rgba(200, 150, 120, 0.2)',
        stroke: '#333',
        strokeWidth: 1.5,
        selectable: true,
        evented: true,
      });
      (rect as unknown as Record<string, unknown>)['_blockBuilderShape'] = true;
      return rect;
    },
  },
  {
    id: 'diamond',
    name: 'Diamond',
    description: 'Rotated square (on-point)',
    fill: 'rgba(120, 180, 160, 0.15)',
    createShape(fabric, canvasSize) {
      const h = canvasSize / 2;
      const path = new fabric.Path(
        `M ${h} 0 L ${canvasSize} ${h} L ${h} ${canvasSize} L 0 ${h} Z`,
        {
          fill: 'rgba(120, 180, 160, 0.2)',
          stroke: '#333',
          strokeWidth: 1.5,
          selectable: true,
          evented: true,
        }
      );
      (path as unknown as Record<string, unknown>)['_blockBuilderShape'] = true;
      return path;
    },
  },
];

/**
 * Block Builder right panel.
 * TOP: Block Info — name, size, save
 * BOTTOM: Block Pieces — draggable common quilt block pieces
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
  const [activeTab, setActiveTab] = useState<'info' | 'library' | 'pieces'>('info');

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const systemBlocks = blocks.filter((b) => b.isDefault);

  const handleDragStart = (piece: BlockPieceDef) => {
    return (e: React.DragEvent) => {
      e.dataTransfer.setData('application/quiltcorgi-block-piece', piece.id);
      e.dataTransfer.effectAllowed = 'copy';
    };
  };

  return (
    <aside className="w-[320px] h-full flex-shrink-0 flex flex-col bg-surface border-l border-outline-variant/15 overflow-hidden">
      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div className="flex border-b border-outline-variant/40 flex-shrink-0">
        <TabButton label="Block Info" active={activeTab === 'info'} onClick={() => setActiveTab('info')} />
        <TabButton label="Block Library" active={activeTab === 'library'} onClick={() => setActiveTab('library')} />
        <TabButton label="Block Pieces" active={activeTab === 'pieces'} onClick={() => setActiveTab('pieces')} />
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

          {/* Save Block */}
          <button
            type="button"
            onClick={onSave}
            className="w-full rounded-full py-3 text-sm font-bold bg-gradient-to-r from-orange-500 to-rose-400 text-white shadow-elevation-2 hover:shadow-elevation-3 transition-all"
          >
            Save Block
          </button>
        </div>
      ) : activeTab === 'pieces' ? (
        /* ── Block Pieces Library ────────────────────────────────── */
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[11px] text-secondary mb-3">
            Drag a piece onto the canvas, or use the drawing tools to create custom shapes.
          </p>
          <div className="space-y-2">
            {BLOCK_PIECES.map((piece) => (
              <div
                key={piece.id}
                draggable
                onDragStart={handleDragStart(piece)}
                className="flex items-start gap-3 p-3 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors cursor-grab active:cursor-grabbing border border-outline-variant/30"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border border-outline-variant/20"
                  style={{ backgroundColor: piece.fill }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    {piece.id === 'hst' && (
                      <path d="M2 2L12 12L2 22Z" stroke="#333" strokeWidth="1.5" fill="none" />
                    )}
                    {piece.id === 'qst' && (
                      <g>
                        <rect x="2" y="2" width="20" height="20" stroke="#333" strokeWidth="1.5" fill="none" />
                        <line x1="2" y1="2" x2="22" y2="22" stroke="#333" strokeWidth="1" />
                        <line x1="22" y1="2" x2="2" y2="22" stroke="#333" strokeWidth="1" />
                      </g>
                    )}
                    {piece.id === 'flying-geese' && (
                      <path d="M12 2L22 22L2 22Z" stroke="#333" strokeWidth="1.5" fill="none" />
                    )}
                    {piece.id === 'square' && (
                      <rect x="4" y="4" width="16" height="16" stroke="#333" strokeWidth="1.5" fill="none" />
                    )}
                    {piece.id === 'rectangle' && (
                      <rect x="2" y="8" width="20" height="8" stroke="#333" strokeWidth="1.5" fill="none" />
                    )}
                    {piece.id === 'diamond' && (
                      <path d="M12 2L22 12L12 22L2 12Z" stroke="#333" strokeWidth="1.5" fill="none" />
                    )}
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-on-surface">{piece.name}</p>
                  <p className="text-[10px] text-secondary leading-tight">{piece.description}</p>
                </div>
              </div>
            ))}
          </div>
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
      className={`flex-1 px-2 py-2.5 text-[11px] font-semibold transition-colors ${active ? 'text-primary border-b-2 border-primary' : 'text-secondary hover:text-on-surface'
        }`}
    >
      {label}
    </button>
  );
}
