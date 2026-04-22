'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  ArrowLeft,
  Download,
  Plus,
  RotateCw,
  ArrowLeftRight,
  Trash2,
  Palette,
} from 'lucide-react';
import Image from 'next/image';
import { useAuthStore } from '@/stores/authStore';
import { SHADOW } from '@/lib/design-system';
import PublicNav from '@/components/landing/PublicNav';
import Footer from '@/components/landing/Footer';
import { FabricLibrary } from '@/components/fabrics/FabricLibrary';

// ─── Types ─────────────────────────────────────────────────────────

type Step = 'landing' | 'layout' | 'size' | 'main';
type LayoutType = 'grid' | 'sashing' | 'on-point';
type ViewMode = 'edit' | 'preview';

interface SizePreset {
  rows: number;
  cols: number;
}

const SIZE_PRESETS: SizePreset[] = [
  { rows: 3, cols: 3 },
  { rows: 4, cols: 4 },
  { rows: 4, cols: 5 },
  { rows: 5, cols: 6 },
  { rows: 6, cols: 7 },
];

/**
 * Derive border/sashing presence from layout type. Keeps the setup flow
 * to just two decisions (layout + size) like the reference app.
 */
function layoutFrame(layout: LayoutType): { hasBorders: boolean; hasSashing: boolean } {
  if (layout === 'grid') return { hasBorders: false, hasSashing: false };
  return { hasBorders: true, hasSashing: true };
}

interface Block {
  id: string;
  url: string;
}

interface PlacedBlock {
  blockId: string;
  rotation: number;
}

interface Background {
  type: 'color' | 'image';
  value: string;
}

// ─── Constants ────────────────────────────────────────────────────────

const MIN_SIZE = 2;
const MAX_SIZE = 12;
const BLOCK_SIZE = 120;
const SASHING_WIDTH = 16;
const BORDER_WIDTH = 32;

// ─── Helpers ──────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function quiltDimensions(
  rows: number,
  cols: number,
  layout: LayoutType,
  hasBorders: boolean,
  hasSashing: boolean
) {
  const sash = hasSashing ? SASHING_WIDTH : 0;
  const border = hasBorders ? BORDER_WIDTH : 0;

  if (layout === 'grid') {
    return {
      width: 2 * border + cols * BLOCK_SIZE + (cols - 1) * sash,
      height: 2 * border + rows * BLOCK_SIZE + (rows - 1) * sash,
    };
  }

  const dStep = (BLOCK_SIZE + sash) * Math.SQRT2;
  const dBlock = BLOCK_SIZE * Math.SQRT2;
  const span = ((cols + rows - 2) * dStep) / 2 + dBlock;
  return { width: 2 * border + span, height: 2 * border + span };
}

function cellCenter(
  r: number,
  c: number,
  rows: number,
  layout: LayoutType,
  hasBorders: boolean,
  hasSashing: boolean
) {
  const sash = hasSashing ? SASHING_WIDTH : 0;
  const border = hasBorders ? BORDER_WIDTH : 0;

  if (layout === 'grid') {
    return {
      cx: border + c * (BLOCK_SIZE + sash) + BLOCK_SIZE / 2,
      cy: border + r * (BLOCK_SIZE + sash) + BLOCK_SIZE / 2,
    };
  }

  const dStep = (BLOCK_SIZE + sash) * Math.SQRT2;
  const dBlock = BLOCK_SIZE * Math.SQRT2;
  return {
    cx: border + ((c - r) * dStep) / 2 + ((rows - 1) * dStep) / 2 + dBlock / 2,
    cy: border + ((c + r) * dStep) / 2 + dBlock / 2,
  };
}

// ─── Component ─────────────────────────────────────────────────────────

export function PictureMyBlocksApp() {
  // Step + layout state
  const [step, setStep] = useState<Step>('landing');
  const [layout, setLayout] = useState<LayoutType>('grid');
  const [size, setSize] = useState<SizePreset>(SIZE_PRESETS[1]);
  const rows = size.rows;
  const cols = size.cols;
  const { hasBorders, hasSashing } = layoutFrame(layout);

  // Canvas state
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [placedBlocks, setPlacedBlocks] = useState<Record<string, PlacedBlock>>({});
  const [background, setBackground] = useState<Background>({ type: 'color', value: '#F5F0E8' });
  const [viewMode, setViewMode] = useState<ViewMode>('edit');

  // Interaction state
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [swapSource, setSwapSource] = useState<string | null>(null);
  const [selectedTrayBlock, setSelectedTrayBlock] = useState<string | null>(null);
  const [showFabricPicker, setShowFabricPicker] = useState(false);

  const isAuthenticated = !!useAuthStore((s) => s.user);
  const quiltRef = useRef<HTMLDivElement>(null);

  // Block upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newBlocks = Array.from(e.target.files).map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      url: URL.createObjectURL(file),
    }));
    setBlocks((prev) => [...prev, ...newBlocks]);
  }, []);

  // Fabric image upload (guest: local only)
  const handleFabricUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const url = URL.createObjectURL(e.target.files[0]);
    setBackground({ type: 'image', value: url });
  }, []);

  // Drop a fabric to set background
  const handleFabricDrop = useCallback((e: React.DragEvent) => {
    const fabricUrl = e.dataTransfer.getData('application/quiltcorgi-fabric-url');
    const hex = e.dataTransfer.getData('application/quiltcorgi-fabric-hex');
    
    if (fabricUrl) {
      e.preventDefault();
      setBackground({ type: 'image', value: fabricUrl });
    } else if (hex) {
      e.preventDefault();
      setBackground({ type: 'color', value: hex });
    }
  }, []);

  // Drag & drop onto grid
  const handleDrop = useCallback((e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData('text/plain');
    if (blockId) {
      setPlacedBlocks((prev) => ({
        ...prev,
        [`${r}-${c}`]: { blockId, rotation: 0 },
      }));
    }
  }, []);

  // Click on a grid square
  const handleSquareClick = useCallback(
    (r: number, c: number) => {
      const key = `${r}-${c}`;

      if (swapSource) {
        setPlacedBlocks((prev) => {
          const next = { ...prev };
          const temp = next[key];
          if (next[swapSource]) {
            next[key] = next[swapSource];
          } else {
            delete next[key];
          }
          if (temp) {
            next[swapSource] = temp;
          } else {
            delete next[swapSource];
          }
          return next;
        });
        setSwapSource(null);
        return;
      }

      if (selectedTrayBlock) {
        setPlacedBlocks((prev) => ({
          ...prev,
          [key]: { blockId: selectedTrayBlock, rotation: 0 },
        }));
        setSelectedTrayBlock(null);
        return;
      }

      if (placedBlocks[key]) {
        setSelectedSquare(selectedSquare === key ? null : key);
      }
    },
    [swapSource, selectedTrayBlock, placedBlocks, selectedSquare]
  );

  const handleRotate = useCallback((key: string) => {
    setPlacedBlocks((prev) => {
      const block = prev[key];
      if (!block) return prev;
      return { ...prev, [key]: { ...block, rotation: block.rotation + 90 } };
    });
  }, []);

  const handleRemove = useCallback((key: string) => {
    setPlacedBlocks((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setSelectedSquare(null);
  }, []);

  const handleSwapInit = useCallback((key: string) => {
    setSwapSource(key);
    setSelectedSquare(null);
  }, []);

  // Download as PNG using native canvas
  const handleDownload = useCallback(async () => {
    if (!quiltRef.current) return;

    const prevMode = viewMode;
    setViewMode('preview');
    setSelectedSquare(null);
    setSwapSource(null);

    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const el = quiltRef.current;
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = el.offsetWidth * scale;
      canvas.height = el.offsetHeight * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(scale, scale);

      // Draw background
      if (background.type === 'color') {
        ctx.fillStyle = background.value;
        ctx.fillRect(0, 0, el.offsetWidth, el.offsetHeight);
      } else {
        const bgImg = await loadImage(background.value);
        const patSize = 200;
        for (let y = 0; y < el.offsetHeight; y += patSize) {
          for (let x = 0; x < el.offsetWidth; x += patSize) {
            ctx.drawImage(bgImg, x, y, patSize, patSize);
          }
        }
      }

      // Draw blocks
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const key = `${r}-${c}`;
          const placed = placedBlocks[key];
          if (!placed) continue;

          const block = blocks.find((b) => b.id === placed.blockId);
          if (!block) continue;

          const { cx, cy } = cellCenter(r, c, rows, layout, hasBorders, hasSashing);
          const img = await loadImage(block.url);

          ctx.save();
          ctx.translate(cx, cy);
          if (layout === 'on-point') ctx.rotate(Math.PI / 4);
          ctx.rotate((placed.rotation * Math.PI) / 180);
          ctx.drawImage(img, -BLOCK_SIZE / 2, -BLOCK_SIZE / 2, BLOCK_SIZE, BLOCK_SIZE);
          ctx.restore();
        }
      }

      const link = document.createElement('a');
      link.download = 'my-quilt.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      alert('Failed to download image. Please try again.');
    } finally {
      setViewMode(prevMode);
    }
  }, [viewMode, background, blocks, placedBlocks, rows, cols, layout, hasBorders, hasSashing]);

  // ─── Setup — combined layout + options + size ────────────────────

  if (step === 'landing') {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
        <PublicNav />
        <main className="flex-1 flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-6 lg:px-12 w-full py-12 lg:py-0">
          <div className="lg:w-1/2 mb-12 lg:mb-0 relative z-10 flex flex-col items-start text-left ml-0">
            <h1
              className="text-5xl lg:text-7xl font-bold mb-6 text-[var(--color-text)]"
              style={{ fontFamily: 'var(--font-display)', lineHeight: '1.05' }}
            >
              Picture my <span className="text-[var(--color-primary)] block">Blocks</span>
            </h1>
            <p className="text-xl text-[var(--color-text-dim)] mb-10 max-w-lg leading-relaxed">
              Take pictures of your finished quilt blocks, drop them into a layout, pick a
              background fabric, and see your quilt before you sew it.
            </p>
            <button
              onClick={() => setStep('layout')}
              className="btn-primary text-xl"
              style={{ paddingInline: '2rem', paddingBlock: '1rem' }}
            >
              Start Designing
            </button>
          </div>
          <div className="lg:w-1/2 relative flex justify-end items-center mr-0 ml-auto mt-4 lg:mt-0">
            <div className="relative w-full max-w-[500px]">
              <Image
                src="/landing-illustrations/Blocks_Floatie.png"
                alt="QuiltCorgi arranging blocks"
                width={600}
                height={600}
                className="h-auto w-full drop-shadow-2xl"
                unoptimized
              />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (step === 'layout') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-[var(--color-bg)] p-8">
        <div className="w-full max-w-4xl">
          <button
            onClick={() => setStep('landing')}
            className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 -ml-3 text-sm font-medium text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors duration-150"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h2
            className="mb-12 text-center text-4xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Pick a layout
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <LayoutCard
              label="Grid"
              description="Blocks sit right next to each other, no space between."
              selected={layout === 'grid'}
              onSelect={() => {
                setLayout('grid');
                setStep('size');
              }}
            >
              <svg width="80" height="80" viewBox="0 0 60 60" aria-hidden="true">
                <rect x="5" y="5" width="22" height="22" fill="var(--color-primary)" opacity="0.8" />
                <rect x="33" y="5" width="22" height="22" fill="var(--color-primary)" opacity="0.8" />
                <rect x="5" y="33" width="22" height="22" fill="var(--color-primary)" opacity="0.8" />
                <rect x="33" y="33" width="22" height="22" fill="var(--color-primary)" opacity="0.8" />
              </svg>
            </LayoutCard>
            <LayoutCard
              label="Grid with sashing"
              description="Blocks are separated by thin strips of fabric."
              selected={layout === 'sashing'}
              onSelect={() => {
                setLayout('sashing');
                setStep('size');
              }}
            >
              <svg width="80" height="80" viewBox="0 0 60 60" aria-hidden="true">
                <rect x="0" y="0" width="60" height="60" fill="var(--color-border)" opacity="0.25" />
                <rect x="8" y="8" width="18" height="18" fill="var(--color-primary)" opacity="0.8" />
                <rect x="34" y="8" width="18" height="18" fill="var(--color-primary)" opacity="0.8" />
                <rect x="8" y="34" width="18" height="18" fill="var(--color-primary)" opacity="0.8" />
                <rect x="34" y="34" width="18" height="18" fill="var(--color-primary)" opacity="0.8" />
              </svg>
            </LayoutCard>
            <LayoutCard
              label="On-point"
              description="Blocks are rotated 45 degrees as diamonds."
              selected={layout === 'on-point'}
              onSelect={() => {
                setLayout('on-point');
                setStep('size');
              }}
            >
              <svg width="80" height="80" viewBox="0 0 60 60" aria-hidden="true">
                <rect x="0" y="0" width="60" height="60" fill="var(--color-border)" opacity="0.25" />
                <g transform="translate(30, 15) rotate(45)">
                  <rect x="-10" y="-10" width="20" height="20" fill="var(--color-primary)" opacity="0.8" />
                </g>
                <g transform="translate(15, 30) rotate(45)">
                  <rect x="-10" y="-10" width="20" height="20" fill="var(--color-primary)" opacity="0.8" />
                </g>
                <g transform="translate(45, 30) rotate(45)">
                  <rect x="-10" y="-10" width="20" height="20" fill="var(--color-primary)" opacity="0.8" />
                </g>
                <g transform="translate(30, 45) rotate(45)">
                  <rect x="-10" y="-10" width="20" height="20" fill="var(--color-primary)" opacity="0.8" />
                </g>
              </svg>
            </LayoutCard>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'size') {
    return (
      <div className="min-h-screen flex flex-col items-center bg-[var(--color-bg)] p-8">
        <div className="w-full max-w-4xl">
          <button
            onClick={() => setStep('layout')}
            className="mb-8 inline-flex items-center gap-2 rounded-full px-3 py-1.5 -ml-3 text-sm font-medium text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors duration-150"
          >
            <ArrowLeft size={18} /> Back
          </button>
          <h2
            className="mb-12 text-center text-4xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Pick a size
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {SIZE_PRESETS.map((preset) => {
              const isSelected =
                size.rows === preset.rows && size.cols === preset.cols;
              return (
                <button
                  key={`${preset.rows}x${preset.cols}`}
                  onClick={() => {
                    setSize(preset);
                    setStep('main');
                  }}
                  className={`rounded-lg border px-8 py-6 text-2xl font-semibold transition-colors duration-150 ${
                    isSelected
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-text)]'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)]/40'
                  }`}
                  style={{ boxShadow: SHADOW.brand }}
                >
                  {preset.rows} × {preset.cols}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Main canvas ──────────────────────────────────────────────────────────

  const dims = quiltDimensions(rows, cols, layout, hasBorders, hasSashing);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header bar */}
      <header
        className="flex items-center justify-between px-4 py-3 bg-[var(--color-surface)] z-20 relative border-b border-[var(--color-border)]"
        style={{ boxShadow: SHADOW.brand }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStep('size')}
            className="p-2 rounded-full hover:bg-[var(--color-primary)]/10 text-[var(--color-text-dim)] transition-colors duration-150"
            aria-label="Back to size picker"
          >
            <ArrowLeft size={20} />
          </button>
          <Image
            src="/logo.png"
            alt="QuiltCorgi"
            width={32}
            height={32}
            unoptimized
            className="object-contain"
          />
          <h1
            className="text-xl font-bold text-[var(--color-text)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            My Quilt
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Edit / Preview toggle */}
          <div className="flex bg-[var(--color-bg)] p-1 rounded-full">
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                viewMode === 'edit'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
              style={viewMode === 'edit' ? { boxShadow: SHADOW.brand } : undefined}
              onClick={() => setViewMode('edit')}
            >
              Edit
            </button>
            <button
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                viewMode === 'preview'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text)]'
                  : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
              }`}
              style={viewMode === 'preview' ? { boxShadow: SHADOW.brand } : undefined}
              onClick={() => {
                setViewMode('preview');
                setSelectedSquare(null);
                setSwapSource(null);
              }}
            >
              Preview
            </button>
          </div>

          {/* Fabric button */}
          <button
            onClick={() => setShowFabricPicker(!showFabricPicker)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
              showFabricPicker
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                : 'bg-[var(--color-bg)] text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            <Palette size={18} /> Fabric
          </button>

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[var(--color-primary)] text-[var(--color-text)] px-4 py-2 rounded-full text-sm font-semibold hover:bg-[#5AA0D5] transition-colors duration-150"
            style={{ boxShadow: SHADOW.brand }}
          >
            <Download size={18} /> Download
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* ── Block tray (left) ───────────────────────────────────────── */}
        <div className="w-72 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col z-10">
          <div className="p-4 border-b border-[var(--color-border)]">
            <label className="flex items-center justify-center gap-2 w-full bg-[var(--color-bg)] hover:bg-[var(--color-primary)]/10 text-[var(--color-text)] py-3 rounded-full cursor-pointer transition-colors duration-150 font-medium">
              <Plus size={20} /> Add a block
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
            {blocks.map((b) => (
              <div
                key={b.id}
                className={`aspect-square bg-[var(--color-bg)] rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border-2 transition-colors duration-150 ${
                  selectedTrayBlock === b.id
                    ? 'border-[var(--color-primary)]'
                    : 'border-transparent hover:border-[var(--color-border)]'
                }`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', b.id);
                  setSelectedTrayBlock(null);
                }}
                onClick={() => setSelectedTrayBlock(selectedTrayBlock === b.id ? null : b.id)}
              >
                <img
                  src={b.url}
                  alt="Quilt block"
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>
            ))}
            {blocks.length === 0 && (
              <div className="col-span-2 text-center text-[var(--color-text-dim)] py-8 text-sm">
                No blocks yet.
                <br />
                Add some to get started.
              </div>
            )}
          </div>
        </div>

        {/* ── Quilt canvas (center) ─────────────────────────────────── */}
        <div
          className="flex-1 overflow-auto bg-[var(--color-bg)] flex"
          onClick={() => {
            setSelectedSquare(null);
            setSwapSource(null);
            setSelectedTrayBlock(null);
          }}
        >
          <div className="m-auto p-12 flex items-center justify-center min-w-max min-h-max">
            <div className="relative">
              <div
                ref={quiltRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFabricDrop}
                style={{
                  width: dims.width,
                  height: dims.height,
                  backgroundColor: background.type === 'color' ? background.value : undefined,
                  backgroundImage:
                    background.type === 'image' ? `url(${background.value})` : undefined,
                  backgroundSize: '200px 200px',
                  position: 'relative',
                  boxShadow: viewMode === 'preview' ? '0 20px 40px rgba(0,0,0,0.15)' : SHADOW.brand,
                  overflow: 'hidden',
                  transition: 'box-shadow 0.15s ease-out',
                }}
              >
                {Array.from({ length: rows }).map((_, r) =>
                  Array.from({ length: cols }).map((_, c) => {
                    const key = `${r}-${c}`;
                    const placed = placedBlocks[key];
                    const block = placed ? blocks.find((b) => b.id === placed.blockId) : null;
                    const { cx, cy } = cellCenter(r, c, rows, layout, hasBorders, hasSashing);
                    const isSelected = selectedSquare === key;
                    const isSwapSrc = swapSource === key;

                    return (
                      <div
                        key={key}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSquareClick(r, c);
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, r, c)}
                        style={{
                          position: 'absolute',
                          left: cx - BLOCK_SIZE / 2,
                          top: cy - BLOCK_SIZE / 2,
                          width: BLOCK_SIZE,
                          height: BLOCK_SIZE,
                          transform: layout === 'on-point' ? 'rotate(45deg)' : 'none',
                          border:
                            viewMode === 'edit' && !placed ? '2px dashed rgba(0,0,0,0.15)' : 'none',
                          backgroundColor:
                            viewMode === 'edit' && !placed
                              ? 'rgba(255,255,255,0.5)'
                              : 'transparent',
                          cursor: viewMode === 'edit' ? 'pointer' : 'default',
                          boxShadow: isSwapSrc
                            ? '0 0 0 4px var(--color-primary)'
                            : isSelected
                              ? '0 0 0 4px var(--color-primary)'
                              : 'none',
                          zIndex: isSelected || isSwapSrc ? 10 : 1,
                          transition: 'box-shadow 0.15s ease-out, background-color 0.15s ease-out',
                        }}
                      >
                        {block && (
                          <img
                            src={block.url}
                            alt="Placed block"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              transform: `rotate(${placed.rotation}deg)`,
                              transition: 'transform 0.15s ease-out',
                              display: 'block',
                            }}
                            draggable={false}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Floating action buttons on selected square */}
              {viewMode === 'edit' &&
                selectedSquare &&
                (() => {
                  const [sr, sc] = selectedSquare.split('-').map(Number);
                  const { cx, cy } = cellCenter(sr, sc, rows, layout, hasBorders, hasSashing);
                  return (
                    <div
                      className="absolute z-50 flex gap-1 bg-[var(--color-text)] text-[var(--color-surface)] p-1.5 rounded-lg"
                      style={{
                        left: cx,
                        top: cy - BLOCK_SIZE / 2 - 12,
                        transform: 'translate(-50%, -100%)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      }}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRotate(selectedSquare);
                        }}
                        className="p-2 hover:bg-[var(--color-text-dim)] rounded-md transition-colors duration-150"
                        title="Rotate"
                      >
                        <RotateCw size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSwapInit(selectedSquare);
                        }}
                        className="p-2 hover:bg-[var(--color-text-dim)] rounded-md transition-colors duration-150"
                        title="Swap"
                      >
                        <ArrowLeftRight size={18} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(selectedSquare);
                        }}
                        className="p-2 hover:bg-[var(--color-error)] text-[var(--color-error)] hover:text-[var(--color-surface)] rounded-md transition-colors duration-150"
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })()}

              {/* Swap hint */}
              {viewMode === 'edit' && swapSource && (
                <div
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-[var(--color-text)] px-6 py-3 rounded-full z-50 pointer-events-none font-medium"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                >
                  Tap another block to swap
                </div>
              )}

              {/* Place hint */}
              {viewMode === 'edit' && selectedTrayBlock && !swapSource && !selectedSquare && (
                <div
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--color-text)] text-[var(--color-surface)] px-6 py-3 rounded-full z-50 pointer-events-none font-medium"
                  style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                >
                  Tap an empty square to place block
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Fabric picker (right panel) ──────────────────────────── */}
        {showFabricPicker && (
          <div className="w-[400px] flex-shrink-0 bg-[var(--color-surface)] border-l border-[var(--color-border)] flex flex-col z-10 relative">
            <FabricLibrary 
              onFabricDragStart={(e, fabricId) => {
                // FabricLibrary internally sets dataTransfer with url and hex values
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────

/**
 * Large selectable card used during the layout-picker step.
 */
function LayoutCard({
  label,
  description,
  selected,
  onSelect,
  children,
}: {
  readonly label: string;
  readonly description: string;
  readonly selected: boolean;
  readonly onSelect: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex flex-col items-center gap-4 rounded-lg border bg-[var(--color-surface)] p-8 text-center transition-colors duration-150 ${
        selected
          ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25'
          : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40'
      }`}
      style={{ boxShadow: SHADOW.brand }}
    >
      {children}
      <h3 className="text-xl font-semibold text-[var(--color-text)]">{label}</h3>
      <p className="text-sm text-[var(--color-text-dim)]">{description}</p>
    </button>
  );
}

// ─── Utilities ───────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
