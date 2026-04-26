'use client';

import { useCallback } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';

interface StudioDropZoneProps {
  children: React.ReactNode;
}

export default function StudioDropZone({ children }: StudioDropZoneProps) {
  const { addFabricToCanvas } = useLayoutStore();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const fabricId = e.dataTransfer.getData('fabricId');
      const imageUrl = e.dataTransfer.getData('imageUrl');
      if (fabricId && imageUrl) {
        addFabricToCanvas({ fabricId, imageUrl, x: e.clientX, y: e.clientY });
      }
    },
    [addFabricToCanvas]
  );

  return (
    <div
      className="relative flex-1 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
}
