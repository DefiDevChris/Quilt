'use client';

import { createContext, useContext, useRef, type RefObject } from 'react';
import type { Canvas as FabricCanvas } from 'fabric';

interface CanvasContextValue {
  canvasRef: RefObject<FabricCanvas | null>;
  getCanvas: () => FabricCanvas | null;
  setCanvas: (c: FabricCanvas | null) => void;
}

const CanvasContext = createContext<CanvasContextValue | null>(null);

export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<FabricCanvas | null>(null);

  const getCanvas = () => canvasRef.current;
  const setCanvas = (c: FabricCanvas | null) => {
    canvasRef.current = c;
  };

  return (
    <CanvasContext.Provider value={{ canvasRef, getCanvas, setCanvas }}>
      {children}
    </CanvasContext.Provider>
  );
}

export function useCanvasContext(): CanvasContextValue {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error('useCanvasContext must be used within a CanvasProvider');
  return ctx;
}
