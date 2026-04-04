'use client';

import { Component, type ReactNode } from 'react';

interface BlockDraftingErrorBoundaryProps {
  children: ReactNode;
  onClose: () => void;
}

interface BlockDraftingErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class BlockDraftingErrorBoundary extends Component<
  BlockDraftingErrorBoundaryProps,
  BlockDraftingErrorBoundaryState
> {
  constructor(props: BlockDraftingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): BlockDraftingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Block Drafting error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[400px] rounded-xl bg-surface p-5 shadow-elevation-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-error">
                  <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Block Drafting Error</h3>
              <p className="text-sm text-secondary mb-6">
                Something went wrong with the block drafting canvas. This might be due to browser compatibility or drawing tool issues.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="px-4 py-2 bg-surface-container text-on-surface rounded-md hover:bg-surface-container-high transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 transition-opacity"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
