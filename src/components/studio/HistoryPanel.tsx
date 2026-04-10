'use client';

import { useMemo, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import type { Canvas as FabricCanvas } from 'fabric';

interface HistoryEntry {
 json: string;
 timestamp: number;
 thumbnail?: string;
}

export function HistoryPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
 const undoStack = useCanvasStore((s) => s.undoStack);
 const [baseTimestamp] = useState(() => Date.now());

 const entries: HistoryEntry[] = useMemo(
 () =>
 undoStack.map((json, i) => ({
 json,
 timestamp: baseTimestamp - (undoStack.length - i) * 1000,
 })),
 [undoStack, baseTimestamp]
 );

 const jumpToState = (index: number) => {
 const fabricCanvas = useCanvasStore.getState().fabricCanvas;
 if (!fabricCanvas) return;

 const canvas = fabricCanvas as FabricCanvas;
 const targetJson = entries[index].json;

 canvas.loadFromJSON(JSON.parse(targetJson), () => {
 canvas.renderAll();
 });

 // Update undo/redo stacks
 const newUndoStack = undoStack.slice(0, index + 1);
 const newRedoStack = undoStack.slice(index + 1);
 useCanvasStore.setState({ undoStack: newUndoStack, redoStack: newRedoStack });
 };

 if (!isOpen) return null;

 return (
 <div className="fixed right-0 top-12 bottom-0 w-64 bg-[#fdfaf7] border-l border-[#e8e1da]/15 shadow-[0_1px_2px_rgba(45,42,38,0.08)] z-40 overflow-y-auto">
 <div className="p-4">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-label-sm uppercase text-[#2d2a26]/70 font-medium">
 History
 </h3>
 <button
 type="button"
 onClick={onClose}
 className="w-6 h-6 flex items-center justify-center rounded-lg text-[#2d2a26]/50 hover:text-[#2d2a26] hover:bg-[#f5f2ef] transition-colors"
 aria-label="Close history"
 >
 <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
 <path
 d="M5 5L15 15M5 15L15 5"
 stroke="currentColor"
 strokeWidth="1.5"
 strokeLinecap="round"
 />
 </svg>
 </button>
 </div>

 {entries.length === 0 ? (
 <p className="text-body-sm text-[#6b655e] text-center py-8">No history yet</p>
 ) : (
 <div className="space-y-2">
 {entries.map((entry, i) => (
 <button
 key={i}
 type="button"
 onClick={() => jumpToState(i)}
 className="w-full text-left p-2 rounded-lg bg-[#f5f2ef] hover:bg-[#e8e1da] transition-colors"
 >
 <div className="text-body-sm text-[#2d2a26]">State {entries.length - i}</div>
 <div className="text-caption text-[#6b655e]">
 {new Date(entry.timestamp).toLocaleTimeString()}
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
