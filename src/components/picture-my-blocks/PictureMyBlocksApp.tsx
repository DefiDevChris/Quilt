'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { UploadCloud, X, Plus } from 'lucide-react';
import { COLORS, withAlpha } from '@/lib/design-system';
import { FabricLibrary } from '@/components/fabrics/FabricLibrary';
import { useToast } from '@/components/ui/ToastProvider';

interface UploadedBlock {
  id: string;
  name: string;
  imageUrl: string;
  fabricJsData?: Record<string, unknown>;
}

export function PictureMyBlocksApp() {
  const [blocks, setBlocks] = useState<UploadedBlock[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<UploadedBlock | null>(null);
  const [gridMode, setGridMode] = useState<'grid' | 'on-point'>('grid');
  const [across, setAcross] = useState(5);
  const [long, setLong] = useState(5);
  const [borders, setBorders] = useState(2);
  const [sashing, setSashing] = useState(0);
  const [selectedFabric, setSelectedFabric] = useState<{ id: string; imageUrl: string } | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  
  // Calculate scale to fit quilt on canvas without vertical scrolling
  useEffect(() => {
    const updateScale = () => {
      if (!canvasRef.current) return;
      
      const availableHeight = window.innerHeight - 48 - 32; // header height + padding
      const availableWidth = window.innerWidth - 640 - 64; // side panels + margins
      
      const quiltElement = canvasRef.current.firstElementChild as HTMLElement;
      if (!quiltElement) return;
      
      // Force a render to measure the natural size
      const naturalWidth = quiltElement.scrollWidth;
      const naturalHeight = quiltElement.scrollHeight;
      
      if (naturalHeight === 0 || naturalWidth === 0) return;
      
      // Calculate scale to fit both width and height
      const heightScale = availableHeight / naturalHeight;
      const widthScale = availableWidth / naturalWidth;
      
      // Use the smaller scale to ensure it fits in both dimensions
      const newScale = Math.min(heightScale, widthScale, 1); // Don't scale up, only down
      
      setCanvasScale(newScale);
    };
    
    updateScale();
    
    // Update on resize and when dimensions change
    window.addEventListener('resize', updateScale);
    setTimeout(updateScale, 100); // Delay to allow DOM to render
    
    return () => window.removeEventListener('resize', updateScale);
  }, [across, long, borders, sashing]);

  // Load user's uploaded blocks from API
  useEffect(() => {
    fetch('/api/blocks')
      .then((r) => r.json())
      .then((data) => {
        if (data.data && Array.isArray(data.data)) {
          setBlocks(data.data);
        } else {
          setBlocks([]);
        }
      })
      .catch(() => {
        setBlocks([]);
      });
  }, []);

  const handleBlockDragStart = useCallback((e: React.DragEvent, block: UploadedBlock) => {
    setDraggedBlock(block);
    e.dataTransfer.setData('application/quiltcorgi-block-id', block.id);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleFabricDragStart = useCallback((e: React.DragEvent, fabric: { id: string; imageUrl: string }) => {
    setSelectedFabric(fabric);
    e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabric.id);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, cellIndex: number) => {
      e.preventDefault();
      const blockId = e.dataTransfer.getData('application/quiltcorgi-block-id');
      if (!blockId) return;

      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;

      // Update the cell with the dropped block
      setCells((prev) => {
        const newCells = [...prev];
        newCells[cellIndex] = { ...newCells[cellIndex], block };
        return newCells;
      });

      toast({
        type: 'success',
        title: 'Block placed',
        description: `${block.name} has been added to the quilt.`,
      });
    },
    [blocks, toast]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // Calculate total cells based on across and long
  const totalCells = across * long;

  // Initialize cells array
  const [cells, setCells] = useState<Array<{ block: UploadedBlock | null }>>([]);

  useEffect(() => {
    setCells(Array.from({ length: totalCells }, () => ({ block: null })));
  }, [totalCells]);

  const handleUploadBlock = useCallback(() => {
    setShowUploadDialog(true);
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        toast({
          type: 'error',
          title: 'Invalid file',
          description: 'Please upload an image file.',
        });
        return;
      }

      const formData = new FormData();
      formData.append('image', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, ''));

      try {
        const res = await fetch('/api/blocks', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? 'Upload failed');
        }

        const newBlock: UploadedBlock = {
          id: data.data.id,
          name: data.data.name,
          imageUrl: data.data.imageUrl,
          fabricJsData: data.data.fabricJsData,
        };

        setBlocks((prev) => [...prev, newBlock]);
        setShowUploadDialog(false);

        toast({
          type: 'success',
          title: 'Block uploaded',
          description: `${newBlock.name} has been added to your library.`,
        });
      } catch {
        toast({
          type: 'error',
          title: 'Upload failed',
          description: 'Something went wrong. Please try again.',
        });
      }
    },
    [toast]
  );

  return (
    <div className="flex h-screen flex-col" style={{ background: COLORS.bg }}>
      {/* Top Bar */}
      <header
        className="h-12 flex items-center justify-between px-4 border-b flex-shrink-0"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: withAlpha(COLORS.border, 0.15),
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[14px] text-[var(--color-text)]/70 hover:text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 3L5 7L9 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </button>
          <h1 className="font-semibold text-[15px]" style={{ color: COLORS.text }}>
            Picture My Blocks
          </h1>
        </div>

        {/* Grid Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: COLORS.textDim }}>
              Grid
            </span>
            <button
              onClick={() => setGridMode('grid')}
              className={`px-2 py-1 text-xs rounded ${
                gridMode === 'grid'
                  ? 'bg-primary/12 text-primary ring-1 ring-primary/30'
                  : 'text-[var(--color-text-dim)]/50 hover:text-[var(--color-text)]'
              }`}
            >
              On
            </button>
            <button
              onClick={() => setGridMode('on-point')}
              className={`px-2 py-1 text-xs rounded ${
                gridMode === 'on-point'
                  ? 'bg-primary/12 text-primary ring-1 ring-primary/30'
                  : 'text-[var(--color-text-dim)]/50 hover:text-[var(--color-text)]'
              }`}
            >
              Point
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: COLORS.textDim }}>
              Across
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={across}
              onChange={(e) => setAcross(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="w-12 px-2 py-1 text-sm border rounded"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: withAlpha(COLORS.border, 0.6),
                color: COLORS.text,
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: COLORS.textDim }}>
              Long
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={long}
              onChange={(e) => setLong(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
              className="w-12 px-2 py-1 text-sm border rounded"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: withAlpha(COLORS.border, 0.6),
                color: COLORS.text,
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: COLORS.textDim }}>
              Borders (″)
            </label>
            <input
              type="number"
              min="0"
              max="24"
              value={borders}
              onChange={(e) => setBorders(Math.max(0, Math.min(24, parseFloat(e.target.value) || 0)))}
              className="w-14 px-2 py-1 text-sm border rounded"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: withAlpha(COLORS.border, 0.6),
                color: COLORS.text,
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs" style={{ color: COLORS.textDim }}>
              Sashing (″)
            </label>
            <input
              type="number"
              min="0"
              max="12"
              value={sashing}
              onChange={(e) => setSashing(Math.max(0, Math.min(12, parseFloat(e.target.value) || 0)))}
              className="w-14 px-2 py-1 text-sm border rounded"
              style={{
                backgroundColor: COLORS.surface,
                borderColor: withAlpha(COLORS.border, 0.6),
                color: COLORS.text,
              }}
            />
          </div>
        </div>

        <div className="w-20" /> {/* Spacer for balance */}
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Blocks Library */}
        <aside
          className="w-[320px] flex-shrink-0 flex flex-col border-r overflow-hidden"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: withAlpha(COLORS.border, 0.15),
          }}
        >
          <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: withAlpha(COLORS.border, 0.4) }}>
            <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
              My Blocks
            </h2>
            <button
              onClick={handleUploadBlock}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
            >
              <Plus size={14} />
              Upload
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {blocks.length === 0 ? (
              <div className="text-center py-8">
                <UploadCloud size={32} style={{ color: COLORS.textDim, opacity: 0.5 }} className="mx-auto mb-2" />
                <p className="text-sm" style={{ color: COLORS.textDim }}>
                  No blocks yet
                </p>
                <p className="text-xs mt-1" style={{ color: COLORS.textDim }}>
                  Upload your first block to get started
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleBlockDragStart(e, block)}
                    className="aspect-square rounded-lg border cursor-grab active:cursor-grabbing overflow-hidden hover:shadow-md transition-shadow"
                    style={{
                      backgroundColor: COLORS.surface,
                      borderColor: withAlpha(COLORS.border, 0.6),
                    }}
                  >
                    <img src={block.imageUrl} alt={block.name} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center Canvas */}
        <main className="flex-1 overflow-hidden p-8 flex items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
          <div
            ref={canvasRef}
            className="mx-auto border shadow-lg"
            style={{
              backgroundColor: selectedFabric?.imageUrl
                ? undefined
                : withAlpha(COLORS.border, 0.1),
              backgroundImage: selectedFabric?.imageUrl ? `url(${selectedFabric.imageUrl})` : undefined,
              backgroundSize: 'cover',
              maxWidth: '100%',
              transform: `scale(${canvasScale})`,
              transformOrigin: 'center center',
            }}
          >
            <div
              className="grid gap-0"
              style={{
                gridTemplateColumns: `repeat(${across}, 1fr)`,
                gap: sashing > 0 ? `${sashing * 4}px` : '0',
                padding: borders > 0 ? `${borders * 4}px` : '0',
              }}
            >
              {cells.map((cell, index) => (
                <div
                  key={index}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragOver={handleDragOver}
                  className={`aspect-square border-2 flex items-center justify-center transition-colors ${
                    cell.block ? 'border-transparent' : 'border-dashed'
                  }`}
                  style={{
                    borderColor: cell.block ? 'transparent' : withAlpha(COLORS.primary, 0.3),
                    backgroundColor: cell.block ? 'transparent' : withAlpha(COLORS.primary, 0.05),
                  }}
                >
                  {cell.block ? (
                    <div className="w-full h-full relative group">
                      <img
                        src={cell.block.imageUrl}
                        alt={cell.block.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setCells((prev) => {
                            const newCells = [...prev];
                            newCells[index] = { block: null };
                            return newCells;
                          });
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: COLORS.textDim }}>
                      Drop block here
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Panel - Fabric Library */}
        <aside
          className="w-[320px] flex-shrink-0 flex flex-col border-l overflow-hidden"
          style={{
            backgroundColor: COLORS.surface,
            borderColor: withAlpha(COLORS.border, 0.15),
          }}
        >
          <div className="p-3 border-b" style={{ borderColor: withAlpha(COLORS.border, 0.4) }}>
            <h2 className="text-sm font-semibold" style={{ color: COLORS.text }}>
              Fabric Library
            </h2>
            <p className="text-xs mt-1" style={{ color: COLORS.textDim }}>
              Drag fabrics to apply to borders and sashing
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <FabricLibrary onFabricDragStart={handleFabricDragStart} />
          </div>
        </aside>
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div
            className="rounded-xl p-6 w-full max-w-md"
            style={{ backgroundColor: COLORS.surface }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: COLORS.text }}>
                Upload Block
              </h3>
              <button onClick={() => setShowUploadDialog(false)} style={{ color: COLORS.textDim }}>
                <X size={20} />
              </button>
            </div>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer"
              style={{
                borderColor: withAlpha(COLORS.border, 0.5),
              }}
              onClick={() => document.getElementById('block-upload-input')?.click()}
            >
              <UploadCloud size={32} style={{ color: COLORS.primary }} className="mx-auto mb-2" />
              <p className="text-sm font-medium" style={{ color: COLORS.text }}>
                Click to upload or drag and drop
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.textDim }}>
                PNG, JPG, or WEBP
              </p>
            </div>
            <input
              id="block-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
