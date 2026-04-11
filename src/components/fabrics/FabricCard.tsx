'use client';

import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/stores/projectStore';
import { useFabricStore } from '@/stores/fabricStore';
import { useCanvasStore } from '@/stores/canvasStore';
import type { FabricListItem } from '@/types/fabric';

interface FabricCardProps {
 fabric: FabricListItem;
 onDragStart: (e: React.DragEvent, fabric: FabricListItem) => void;
 onRemove?: () => void;
 onClick?: () => void;
}

export function FabricCard({ fabric, onDragStart, onRemove, onClick }: FabricCardProps) {
 const imgSrc = fabric.thumbnailUrl ?? fabric.imageUrl;
 const addFabricPreset = useProjectStore((s) => s.addFabricPreset);
 const setWhereUsedFabric = useFabricStore((s) => s.setWhereUsedFabric);
 const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
 const [showMenu, setShowMenu] = useState(false);
 const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
 const menuRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 if (!showMenu) return;
 const handleClick = (e: MouseEvent) => {
 if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
 setShowMenu(false);
 }
 };
 document.addEventListener('mousedown', handleClick);
 return () => document.removeEventListener('mousedown', handleClick);
 }, [showMenu]);

 const handleContextMenu = (e: React.MouseEvent) => {
 e.preventDefault();
 setMenuPos({ x: e.clientX, y: e.clientY });
 setShowMenu(true);
 };

 const handleAddToPresets = () => {
 addFabricPreset({ id: fabric.id, name: fabric.name, imageUrl: fabric.imageUrl });
 setShowMenu(false);
 };

 const handleWhereUsed = async () => {
 setShowMenu(false);
 setWhereUsedFabric(fabric.id, fabric.imageUrl);

 if (!fabricCanvas) return;
 const fabricModule = await import('fabric');
 const canvas = fabricCanvas as InstanceType<typeof fabricModule.Canvas>;
 const allObjects = canvas.getObjects();

 const matchingObjects = allObjects.filter((obj: unknown) => {
 const o = obj as Record<string, unknown>;
 const fill = o.fill;
 let objImageUrl = '';
 if (fill && typeof fill !== 'string') {
 const pattern = fill as { source?: { src?: string } };
 objImageUrl = pattern.source?.src ?? '';
 }
 const objFabricId = (obj as unknown as { fabricId?: string }).fabricId ?? '';

 return (
 (fabric.id && objFabricId === fabric.id) ||
 (fabric.imageUrl && objImageUrl === fabric.imageUrl)
 );
 });

 if (matchingObjects.length > 0) {
 const selection = new fabricModule.ActiveSelection(
 matchingObjects as InstanceType<typeof fabricModule.FabricObject>[],
 { canvas }
 );
 canvas.setActiveObject(selection);
 canvas.renderAll();
 }
 };

 return (
 <>
 <div
 draggable
 onDragStart={(e) => onDragStart(e, fabric)}
 onClick={onClick}
 onContextMenu={handleContextMenu}
 className="group relative cursor-grab rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] overflow-hidden hover:border-[#ff8d49] transition-colors"
 title={fabric.name}
 >
 <div className="aspect-square">
 {imgSrc ? (
 <img
 src={imgSrc}
 alt={fabric.name}
 className="h-full w-full object-cover"
 loading="lazy"
 />
 ) : (
 <div className="h-full w-full flex items-center justify-center bg-[var(--color-border)]">
 <span className="text-2xl text-[var(--color-text-dim)]">🧵</span>
 </div>
 )}
 </div>
 <div className="absolute inset-x-0 bottom-0 bg-[var(--color-bg)] px-1.5 pb-1 pt-4">
 <p className="text-xs text-[var(--color-text)] truncate">{fabric.name}</p>
 {fabric.manufacturer && (
 <p className="text-[9px] text-[var(--color-text)]/70 truncate">{fabric.manufacturer}</p>
 )}
 </div>
 {onRemove && (
 <button
 type="button"
 onClick={onRemove}
 className="absolute top-1 right-1 w-5 h-5 rounded-lg bg-[#ffc7c7]/80 text-white text-xs opacity-0 group-hover:opacity-100 hover:bg-[#ffc7c7] transition-colors duration-150"
 title="Remove from presets"
 >
 ✕
 </button>
 )}
 </div>
 {showMenu && (
 <div
 ref={menuRef}
 className="fixed z-50 min-w-[160px] rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[0_1px_2px_rgba(45,42,38,0.08)] py-1"
 style={{ left: menuPos.x, top: menuPos.y }}
 >
 <button
 type="button"
 onClick={handleAddToPresets}
 className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
 >
 Add to Presets
 </button>
 <button
 type="button"
 onClick={handleWhereUsed}
 className="w-full px-3 py-2 text-left text-sm text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
 >
 Where Used
 </button>
 </div>
 )}
 </>
 );
}
