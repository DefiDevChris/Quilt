'use client';

import { Component, type ReactNode } from 'react';

interface PhotoPatternErrorBoundaryProps {
  children: ReactNode;
}

interface PhotoPatternErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class PhotoPatternErrorBoundary extends Component<
  PhotoPatternErrorBoundaryProps,
  PhotoPatternErrorBoundaryState
> {
  constructor(props: PhotoPatternErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): PhotoPatternErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.error('Photo-to-Pattern error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="glass-elevated rounded-xl w-[95vw] max-w-[500px] p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-error">
                  <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-on-surface mb-2">Photo Processing Error</h3>
              <p className="text-sm text-secondary mb-6">
                Something went wrong while processing your photo. This might be due to image format or browser compatibility.
              </p>
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
      );
    }

    return this.props.children;
  }
}
