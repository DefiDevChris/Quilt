const fs = require('fs');
let code = `
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as fabric from 'fabric';
import { BlockLibrary } from '@/components/blocks/BlockLibrary';
import { FabricLibrary } from '@/components/fabrics/FabricLibrary';
import { useBlockStore } from '@/stores/blockStore';
import { useFabricStore } from '@/stores/fabricStore';
import { COLORS } from '@/lib/design-system';

export function PictureMyBlocksApp({ isPro }: { isPro: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);

  const [layoutMode, setLayoutMode] = useState<'grid' | 'on-point'>('grid');
  const [across, setAcross] = useState(3);
  const [long, setLong] = useState(3);
  const [borderInches, setBorderInches] = useState(2);
  const [sashingInches, setSashingInches] = useState(1);
  const [blockSizeInches, setBlockSizeInches] = useState(12);

  // We need standard block definitions
  const fetchBlocks = useBlockStore((s: any) => s.fetchBlocks);
  const fetchUserBlocks = useBlockStore((s: any) => s.fetchUserBlocks);
  const fetchFabrics = useFabricStore((s: any) => s.fetchFabrics);
  const fetchUserFabrics = useFabricStore((s: any) => s.fetchUserFabrics);

  const [cellBlocks, setCellBlocks] = useState<Record<string, string>>({}); // cellId -> blockId

  // Track sashing fabrics similarly?
  const [borderFabricUrl, setBorderFabricUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchBlocks();
    fetchUserBlocks();
    fetchFabrics();
    fetchUserFabrics();
  }, [fetchBlocks, fetchUserBlocks, fetchFabrics, fetchUserFabrics]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      preserveObjectStacking: true,
      selection: false,
    });
    fabricCanvas.current = canvas;

    const handleResize = () => {
      if (containerRef.current && fabricCanvas.current) {
        fabricCanvas.current.setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
        renderLayout();
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, []);

  const renderLayout = useCallback(async () => {
    if (!fabricCanvas.current || !containerRef.current) return;
    const canvas = fabricCanvas.current;
    canvas.clear();

    const containerW = containerRef.current.clientWidth;
    const containerH = containerRef.current.clientHeight;

    const totalWInches = borderInches * 2 + (across - 1) * sashingInches + across * blockSizeInches;
    const totalHInches = borderInches * 2 + (long - 1) * sashingInches + long * blockSizeInches;

    const padding = 40;
    const scaleX = (containerW - padding * 2) / totalWInches;
    const scaleY = (containerH - padding * 2) / totalHInches;
    const scale = Math.min(scaleX, scaleY); // pixels per inch

    const offsetX = (containerW - totalWInches * scale) / 2;
    const offsetY = (containerH - totalHInches * scale) / 2;

    const blocksData = useBlockStore.getState().blocks;
    const userBlocksData = useBlockStore.getState().userBlocks;
    const allBlocks = [...blocksData, ...userBlocksData];

    if (layoutMode === 'grid') {
      const background = new fabric.Rect({
        left: offsetX,
        top: offsetY,
        width: totalWInches * scale,
        height: totalHInches * scale,
        fill: borderFabricUrl ? undefined : COLORS.primary + '20', // lightly colored if no fabric
        selectable: false,
        name: 'border-background',
        hoverCursor: 'default',
      });
      canvas.add(background);

      if (borderFabricUrl) {
         fabric.FabricImage.fromURL(borderFabricUrl).then((img: fabric.FabricImage) => {
           const pattern = new fabric.Pattern({
             source: img.getElement() as HTMLImageElement,
             repeat: 'repeat'
           });
           background.set('fill', pattern as any);
           canvas.requestRenderAll();
         }).catch(console.error);
      }

      for (let r = 0; r < long; r++) {
        for (let c = 0; c < across; c++) {
          const x = offsetX + (borderInches + c * (blockSizeInches + sashingInches)) * scale;
          const y = offsetY + (borderInches + r * (blockSizeInches + sashingInches)) * scale;
          const cellId = \`cell-\${r}-\${c}\`;

          const blockRect = new fabric.Rect({
            left: x,
            top: y,
            width: blockSizeInches * scale,
            height: blockSizeInches * scale,
            fill: COLORS.surface,
            stroke: COLORS.border,
            strokeWidth: 1,
            selectable: false,
            name: cellId,
            hoverCursor: 'pointer',
          });

          canvas.add(blockRect);

          const blockId = cellBlocks[cellId];
          if (blockId) {
            const blockObj = allBlocks.find(b => b.id === blockId);
            if (blockObj && ((blockObj as any).photoUrl || blockObj.thumbnailUrl)) {
               fabric.FabricImage.fromURL(((blockObj as any).photoUrl || blockObj.thumbnailUrl) as string).then((img: fabric.FabricImage) => {
                 const sX = (blockSizeInches * scale) / (img.width || 1);
                 const sY = (blockSizeInches * scale) / (img.height || 1);

                 img.set({
                   left: x,
                   top: y,
                   scaleX: sX,
                   scaleY: sY,
                   selectable: false,
                   evented: false
                 });
                 canvas.add(img);
                 canvas.requestRenderAll();
               });
            }
          } else {
             const text = new fabric.Text('Drop Block', {
               left: x + (blockSizeInches * scale) / 2,
               top: y + (blockSizeInches * scale) / 2,
               originX: 'center',
               originY: 'center',
               fontSize: 14 * (scale / 10),
               fill: COLORS.textDim,
               selectable: false,
               evented: false,
             });
             canvas.add(text);
          }
        }
      }
    } else {
       const text = new fabric.Text('On-Point layout math pending...', {
         left: containerW / 2,
         top: containerH / 2,
         originX: 'center',
         originY: 'center',
         selectable: false
       });
       canvas.add(text);
    }
    canvas.requestRenderAll();
  }, [across, long, borderInches, sashingInches, blockSizeInches, layoutMode, cellBlocks, borderFabricUrl]);

  useEffect(() => {
    renderLayout();
  }, [renderLayout]);

  const handleBlockDragStart = useCallback((e: React.DragEvent, blockId: string) => {
    e.dataTransfer.setData('application/quiltcorgi-block-id', blockId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleFabricDragStart = useCallback((e: React.DragEvent, fabricId: string) => {
    e.dataTransfer.setData('application/quiltcorgi-fabric-id', fabricId);
    e.dataTransfer.effectAllowed = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!fabricCanvas.current) return;

    const blockId = e.dataTransfer.getData('application/quiltcorgi-block-id');
    const fabricId = e.dataTransfer.getData('application/quiltcorgi-fabric-id');

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pointer = fabricCanvas.current.getScenePoint(e as any);
    const target = fabricCanvas.current.getObjects().reverse().find((obj: fabric.Object) => {
       if (!(obj as any).name) return false;
       return obj.containsPoint(new fabric.Point(pointer.x, pointer.y));
    });

    if (blockId) {
      if (target && (target as any).name && (target as any).name.startsWith('cell-')) {
         setCellBlocks((prev: Record<string, string>) => ({ ...prev, [(target as any).name!]: blockId }));
      }
    } else if (fabricId) {
      const allFabrics = [...useFabricStore.getState().fabrics, ...useFabricStore.getState().userFabrics];
      const fabObj = allFabrics.find(f => f.id === fabricId);
      if (fabObj) {
         if (target && (target as any).name === 'border-background') {
            setBorderFabricUrl(fabObj.imageUrl);
         }
      }
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[var(--color-bg)]">
      <aside className="w-[320px] h-full flex-shrink-0 border-r border-[var(--color-border)]/15 flex flex-col bg-white">
        <div className="p-4 border-b border-[var(--color-border)]/15 font-bold">
          My Blocks
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <BlockLibrary onBlockDragStart={handleBlockDragStart} />
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="h-16 flex-shrink-0 border-b border-[var(--color-border)]/15 bg-white flex items-center px-6 gap-6 overflow-x-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Layout:</label>
            <select
              value={layoutMode}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setLayoutMode(e.target.value as 'grid' | 'on-point')}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="grid">Grid</option>
              <option value="on-point">On-Point</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Across:</label>
            <input
              type="number" min="1" max="10" value={across}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAcross(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm w-16"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Long:</label>
            <input
              type="number" min="1" max="10" value={long}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLong(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm w-16"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Border (in):</label>
            <input
              type="number" min="0" max="24" value={borderInches}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBorderInches(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm w-16"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold">Sashing (in):</label>
            <input
              type="number" min="0" max="12" value={sashingInches}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSashingInches(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm w-16"
            />
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 relative"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <canvas ref={canvasRef} />
        </div>
      </main>

      <aside className="w-[320px] h-full flex-shrink-0 border-l border-[var(--color-border)]/15 flex flex-col bg-white">
         <div className="p-4 border-b border-[var(--color-border)]/15 font-bold">
          Fabrics
        </div>
        <div className="flex-1 overflow-hidden flex flex-col">
          <FabricLibrary onFabricDragStart={handleFabricDragStart} />
        </div>
      </aside>
    </div>
  );
}
`
fs.writeFileSync('src/components/picture-my-blocks/PictureMyBlocksApp.tsx', code);
