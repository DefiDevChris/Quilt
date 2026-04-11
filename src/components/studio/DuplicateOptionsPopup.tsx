'use client';

import { useEffect, useState } from 'react';
import { useCanvasStore } from '@/stores/canvasStore';
import { useProjectStore } from '@/stores/projectStore';

export function DuplicateOptionsPopup() {
 const [show, setShow] = useState(false);
 const [objects, setObjects] = useState<unknown[]>([]);
 const fabricCanvas = useCanvasStore((s) => s.fabricCanvas);
 const worktables = useProjectStore((s) => s.worktables);

 useEffect(() => {
 const handler = (e: Event) => {
 const detail = (e as CustomEvent).detail;
 setObjects(detail.objects);
 setShow(true);
 };
 window.addEventListener('quiltcorgi:show-duplicate-options', handler);
 return () => window.removeEventListener('quiltcorgi:show-duplicate-options', handler);
 }, []);

 const duplicateToCurrent = async () => {
 if (!fabricCanvas || objects.length === 0) return;
 const canvas = fabricCanvas as unknown as {
 toJSON: () => Record<string, unknown>;
 discardActiveObject: () => void;
 add: (...objs: unknown[]) => void;
 requestRenderAll: () => void;
 };

 const json = JSON.stringify(canvas.toJSON());
 useCanvasStore.getState().pushUndoState(json);

 const clonePromises = objects.map((obj) =>
 (obj as { clone: () => Promise<unknown> }).clone()
 );
 const clones = await Promise.all(clonePromises);

 canvas.discardActiveObject();
 const OFFSET = 20;
 clones.forEach((clone) => {
 const clonedObj = clone as {
 left: number;
 top: number;
 set: (props: Record<string, number>) => void;
 };
 clonedObj.set({ left: clonedObj.left + OFFSET, top: clonedObj.top + OFFSET });
 canvas.add(clone);
 });
 canvas.requestRenderAll();
 useProjectStore.getState().setDirty(true);
 setShow(false);
 };

 const duplicateToNew = async () => {
 if (!fabricCanvas || objects.length === 0) return;
 const canvas = fabricCanvas as unknown as { toJSON: () => Record<string, unknown> };

 const clonePromises = objects.map((obj) =>
 (obj as { clone: () => Promise<unknown> }).clone()
 );
 const clones = await Promise.all(clonePromises);

 // Create new worktable with cloned objects
 const newName = `Worktable ${worktables.length + 1}`;
 useProjectStore.getState().addWorktable(newName);

 // Build canvas data with clones
 const cloneData = clones.map((clone) => {
 const obj = clone as { toJSON: () => Record<string, unknown> };
 return obj.toJSON();
 });

 const newWorktableId = useProjectStore.getState().activeWorktableId;
 useProjectStore.getState().updateWorktableCanvas(newWorktableId, { objects: cloneData });

 // Reload canvas
 const activeWorktable = useProjectStore
 .getState()
 .worktables.find((w) => w.id === newWorktableId);
 if (activeWorktable) {
 await (
 canvas as unknown as { loadFromJSON: (data: unknown) => Promise<void> }
 ).loadFromJSON(activeWorktable.canvasData);
 (canvas as unknown as { renderAll: () => void }).renderAll();
 }

 setShow(false);
 };

 if (!show) return null;

 return (
 <div
 className="fixed inset-0 bg-[#2d2a26]/20 flex items-center justify-center z-50"
 onClick={() => setShow(false)}
 >
 <div
 className="bg-[#fdfaf7] rounded-lg shadow-[0_1px_2px_rgba(45,42,38,0.08)] p-4 min-w-64"
 onClick={(e) => e.stopPropagation()}
 >
 <h4 className="text-sm font-semibold text-[#2d2a26] mb-3">Duplicate to:</h4>
 <div className="flex flex-col gap-2">
 <button
 type="button"
 onClick={duplicateToCurrent}
 className="px-4 py-2 text-sm font-medium text-[#2d2a26] bg-[#f5f2ef] hover:bg-[#e8e1da] rounded-lg transition-colors text-left"
 >
 Current Worktable
 </button>
 {worktables.length < 10 && (
 <button
 type="button"
 onClick={duplicateToNew}
 className="px-4 py-2 text-sm font-medium text-[#2d2a26] bg-[#f5f2ef] hover:bg-[#e8e1da] rounded-lg transition-colors text-left"
 >
 New Worktable
 </button>
 )}
 </div>
 </div>
 </div>
 );
}
