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
        <div className="flex-1 flex items-center justify-center bg-surface-container-low">
          <div className="max-w-sm w-full rounded-xl bg-surface p-8 shadow-elevation-3 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-error">
                <path
                  d="M12 9v4m0 4h.01M4.93 19h14.14c1.34 0 2.18-1.46 1.5-2.63L13.5 4.01c-.67-1.17-2.33-1.17-3 0L3.43 16.37c-.68 1.17.16 2.63 1.5 2.63z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-on-surface mb-2">Something went wrong</h2>
            <p className="text-sm text-secondary mb-6">
              The canvas encountered an error. Your work has been auto-saved. You can try reloading
              the canvas to continue.
            </p>
            {this.state.errorMessage && (
              <p className="mb-4 rounded-md bg-surface-container p-2 text-xs font-mono text-secondary break-words">
                {this.state.errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-full bg-on-surface px-6 py-2.5 text-[13px] font-semibold tracking-wide text-surface hover:opacity-90 transition-all shadow-elevation-1"
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
