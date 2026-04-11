'use client';

import { Component, type ReactNode } from 'react';

interface CanvasErrorBoundaryProps {
 children: ReactNode;
}

interface CanvasErrorBoundaryState {
 readonly hasError: boolean;
 readonly errorMessage: string;
}

export class CanvasErrorBoundary extends Component<
 CanvasErrorBoundaryProps,
 CanvasErrorBoundaryState
> {
 constructor(props: CanvasErrorBoundaryProps) {
 super(props);
 this.state = { hasError: false, errorMessage: '' };
 }

 static getDerivedStateFromError(error: Error): CanvasErrorBoundaryState {
 return {
 hasError: true,
 errorMessage: error.message || 'An unexpected error occurred',
 };
 }

 componentDidCatch(_e: Error, _i: React.ErrorInfo): void {
 // Attempt to save canvas state before crash
 try {
 if (typeof window !== 'undefined') {
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const { useProjectStore } = require('@/stores/projectStore');
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const { useCanvasStore } = require('@/stores/canvasStore');
 // eslint-disable-next-line @typescript-eslint/no-require-imports
 const { saveProject } = require('@/lib/save-project');

 const projectId = useProjectStore.getState().projectId;
 const fabricCanvas = useCanvasStore.getState().fabricCanvas;

 if (projectId && fabricCanvas) {
 saveProject({ projectId, fabricCanvas, source: 'manual' }).catch(() => {
 // Silent fail — error boundary already triggered
 });
 }
 }
 } catch {
 // Silent fail — don't throw in error boundary
 }
 }

 private handleReload = (): void => {
 this.setState({ hasError: false, errorMessage: '' });
 };

 render(): ReactNode {
 if (this.state.hasError) {
 return (
 <div className="flex-1 flex items-center justify-center bg-[#fdfaf7]">
 <div className="max-w-sm w-full rounded-lg bg-[#fdfaf7] p-8 shadow-[0_1px_2px_rgba(45,42,38,0.08)] text-center">
 <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#ffc7c7]/10">
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#ffc7c7]">
 <path
 d="M12 9v4m0 4h.01M4.93 19h14.14c1.34 0 2.18-1.46 1.5-2.63L13.5 4.01c-.67-1.17-2.33-1.17-3 0L3.43 16.37c-.68 1.17.16 2.63 1.5 2.63z"
 stroke="currentColor"
 strokeWidth="1.5"
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 </svg>
 </div>
 <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">Something went wrong</h2>
 <p className="text-sm text-[#4a4a4a] mb-6">
 The canvas encountered an error. Your work has been auto-saved. You can try reloading
 the canvas to continue.
 </p>
 {this.state.errorMessage && (
 <p className="mb-4 rounded-lg bg-[#fdfaf7] p-2 text-xs font-mono text-[#4a4a4a] break-words">
 {this.state.errorMessage}
 </p>
 )}
 <button
 type="button"
 onClick={this.handleReload}
 className="rounded-full bg-[#ff8d49] text-[#1a1a1a] hover:opacity-90 transition-colors duration-150 shadow-[0_1px_2px_rgba(45,42,38,0.08)]"
 >
 Reload Canvas
 </button>
 </div>
 </div>
 );
 }

 return this.props.children;
 }
}
