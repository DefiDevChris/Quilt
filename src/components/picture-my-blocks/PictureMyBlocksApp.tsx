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
  const [across, setAcross] = useState(3);
  const [long, setLong] = useState(4);
  const [borders, setBorders] = useState(2);
  const [sashing, setSashing] = useState(0);
  const [selectedFabric, setSelectedFabric] = useState<{ id: string; imageUrl: string } | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
const [canvasScale, setCanvasScale] = useState(1);
	const [cells, setCells] = useState<Array<{ block: UploadedBlock | null }>>([]);

	// Calculate total cells based on across and long
	const totalCells = across * long;

	// Initialize cells array
	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setCells(Array.from({ length: totalCells }, () => ({ block: null })));
	}, [totalCells]);

	// Calculate scale to fit quilt on canvas without vertical scrolling
  useEffect(() => {
    const updateScale = () => {
      if (!canvasRef.current) return;
      
      // Target height is 90% of the available canvas area height
      const mainElement = canvasRef.current.closest('main');
      const containerHeight = mainElement ? mainElement.clientHeight : window.innerHeight - 48 - 32;
      const targetHeight = containerHeight * 0.9;

      // Available width inside main: subtract horizontal padding (~64px total)
      const availableWidth = mainElement ? mainElement.clientWidth - 64 : window.innerWidth - 640 - 64;

      const quiltElement = canvasRef.current.firstElementChild as HTMLElement;
      if (!quiltElement) return;

      // Force a render to measure the natural size
      const naturalWidth = quiltElement.offsetWidth;
      const naturalHeight = quiltElement.offsetHeight;

      if (naturalHeight === 0 || naturalWidth === 0) return;

      // Calculate scale to fit height at 85% and width
      const heightScale = targetHeight / naturalHeight;
      const widthScale = availableWidth / naturalWidth;

      // Use the smaller scale to ensure it fits in both dimensions.
      // Allow scaling up so the quilt fills ~90% of the vertical space
      // regardless of block count, while still fitting horizontally.
      const newScale = Math.min(heightScale, widthScale);

      setCanvasScale(newScale);
    };
    
    updateScale();
    
    // Update on resize and when dimensions change
    window.addEventListener('resize', updateScale);
    setTimeout(updateScale, 100); // Delay to allow DOM to render
    
    return () => window.removeEventListener('resize', updateScale);
  }, [across, long, borders, sashing, gridMode]);

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

  const handleFabricDragStart = useCallback((e: React.DragEvent, fabricId: string) => {
    setSelectedFabric({ id: fabricId, imageUrl: fabricId });
    e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabricId);
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
        setCells((prev) =>
        prev.map((c, i) => (i === cellIndex ? { ...c, block } : c)),
      );

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
    <div className="flex h-full flex-col overflow-hidden" style={{ background: COLORS.bg }}>
      {/* Top Bar */}
      <header
        className="h-12 flex items-center justify-between px-4 border-b flex-shrink-0"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: withAlpha(COLORS.border, 0.15),
        }}
      >
        <div className="w-20" />

        {/* Grid Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: COLORS.textDim }}>
              Layout
            </span>
            <button
              onClick={() => setGridMode('grid')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors duration-150 ${
                gridMode === 'grid'
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-[var(--color-text-dim)]/70 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setGridMode('on-point')}
              className={`px-3 py-1.5 text-xs rounded-full transition-colors duration-150 ${
                gridMode === 'on-point'
                  ? 'bg-primary/20 text-primary font-medium'
                  : 'text-[var(--color-text-dim)]/70 hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30'
              }`}
            >
              On Point
            </button>
          </div>

          <div className="h-5 w-px" style={{ backgroundColor: withAlpha(COLORS.border, 0.3) }} />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setAcross(Math.max(1, across - 1))}
              className="p-1.5 rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
              aria-label="Decrease across"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 10.5L5.5 7L9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-sm font-medium min-w-[1.5rem] text-center" style={{ color: COLORS.text }}>
              {across}
            </span>
            <button
              onClick={() => setAcross(Math.min(10, across + 1))}
              className="p-1.5 rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
              aria-label="Increase across"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3.5L8.5 7L5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-xs ml-1" style={{ color: COLORS.textDim }}>Across</span>
          </div>

          <div className="h-5 w-px" style={{ backgroundColor: withAlpha(COLORS.border, 0.3) }} />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLong(Math.max(1, long - 1))}
              className="p-1.5 rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
              aria-label="Decrease long"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 10.5L5.5 7L9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-sm font-medium min-w-[1.5rem] text-center" style={{ color: COLORS.text }}>
              {long}
            </span>
            <button
              onClick={() => setLong(Math.min(10, long + 1))}
              className="p-1.5 rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
              aria-label="Increase long"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3.5L8.5 7L5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-xs ml-1" style={{ color: COLORS.textDim }}>Long</span>
          </div>

          <div className="h-5 w-px" style={{ backgroundColor: withAlpha(COLORS.border, 0.3) }} />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setBorders(Math.max(0, borders - 1))}
              className="p-1.5 rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
              aria-label="Decrease borders"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 10.5L5.5 7L9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-sm font-medium min-w-[1.5rem] text-center" style={{ color: COLORS.text }}>
              {borders}
            </span>
            <button
              onClick={() => setBorders(Math.min(24, borders + 1))}
              className="p-1.5 rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
              aria-label="Increase borders"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3.5L8.5 7L5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-xs ml-1" style={{ color: COLORS.textDim }}>Border″</span>
          </div>

          <div className="h-5 w-px" style={{ backgroundColor: withAlpha(COLORS.border, 0.3) }} />

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSashing(Math.max(0, sashing - 1))}
              className="p-1.5 rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
              aria-label="Decrease sashing"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 10.5L5.5 7L9 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-sm font-medium min-w-[1.5rem] text-center" style={{ color: COLORS.text }}>
              {sashing}
            </span>
            <button
              onClick={() => setSashing(Math.min(12, sashing + 1))}
              className="p-1.5 rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
              aria-label="Increase sashing"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 3.5L8.5 7L5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-xs ml-1" style={{ color: COLORS.textDim }}>Sash″</span>
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
            className="mx-auto flex items-center justify-center"
            style={{
              maxWidth: '100%',
              transform: `scale(${canvasScale})`,
              transformOrigin: 'center center',
            }}
          >
            {gridMode === 'on-point' ? (
              /* TRUE ON-POINT LAYOUT
                 - Rectangular quilt top (overflow-hidden so diamonds clip into setting/corner triangles)
                 - Each block is rotated 45° (diamond) at its grid position
                 - Block-to-block spacing along each axis = block diagonal (+ optional sashing)
                 - The clipped negative space along edges and corners IS the setting/corner triangles,
                   filled by the selected fabric (or a neutral hint when no fabric is chosen). */
              (() => {
                const blockPx = 120;
                const sashPx = sashing * 4;
                const spacing = blockPx * Math.SQRT2 + sashPx;
                const halfSpacing = spacing / 2;
                const innerW = across * spacing;
                const innerH = long * spacing;
                const borderPx = borders * 4;
                return (
                  <div
                    className="relative border shadow-elevated"
                    style={{
                      backgroundColor: selectedFabric?.imageUrl
                        ? undefined
                        : withAlpha(COLORS.border, 0.1),
                      backgroundImage: selectedFabric?.imageUrl
                        ? `url(${selectedFabric.imageUrl})`
                        : undefined,
                      backgroundSize: 'cover',
                      width: `${innerW + borderPx * 2}px`,
                      height: `${innerH + borderPx * 2}px`,
                      padding: `${borderPx}px`,
                    }}
                  >
                    <div
                      className="quilt-grid-container relative overflow-hidden"
                      style={{ width: `${innerW}px`, height: `${innerH}px` }}
                    >
                      {cells.map((cell, index) => {
                        const r = Math.floor(index / across);
                        const c = index % across;
                        const cx = c * spacing + halfSpacing;
                        const cy = r * spacing + halfSpacing;
                        return (
                          <div
                            key={index}
                            onDrop={(e) => handleDrop(e, index)}
                            onDragOver={handleDragOver}
                            className={`absolute border-2 flex items-center justify-center transition-all duration-300 ${
                              cell.block ? 'border-transparent' : 'border-dashed'
                            }`}
                            style={{
                              width: `${blockPx}px`,
                              height: `${blockPx}px`,
                              left: `${cx - blockPx / 2}px`,
                              top: `${cy - blockPx / 2}px`,
                              transform: 'rotate(45deg)',
                              borderColor: cell.block
                                ? 'transparent'
                                : withAlpha(COLORS.primary, 0.3),
                              backgroundColor: cell.block
                                ? 'transparent'
                                : withAlpha(COLORS.primary, 0.05),
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
                                  style={{ transform: 'rotate(-45deg)' }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <span
                                className="text-xs"
                                style={{
                                  color: COLORS.textDim,
                                  transform: 'rotate(-45deg)',
                                }}
                              >
                                Drop block here
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : (
              /* STANDARD GRID WRAPPER */
              <div
                className="quilt-grid-container grid gap-0 transition-all duration-300 border shadow-elevated"
                style={{
                  backgroundColor: selectedFabric?.imageUrl ? undefined : withAlpha(COLORS.border, 0.1),
                  backgroundImage: selectedFabric?.imageUrl ? `url(${selectedFabric.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  gridTemplateColumns: `repeat(${across}, 120px)`,
                  gridTemplateRows: `repeat(${long}, 120px)`,
                  gap: sashing > 0 ? `${sashing * 4}px` : '0',
                  padding: borders > 0 ? `${borders * 4}px` : '0',
                }}
              >
                {cells.map((cell, index) => (
                  <div
                    key={index}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragOver={handleDragOver}
                    className={`w-[120px] h-[120px] border-2 flex items-center justify-center transition-all duration-300 ${
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
            )}
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
            className="rounded-lg p-6 w-full max-w-md"
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
