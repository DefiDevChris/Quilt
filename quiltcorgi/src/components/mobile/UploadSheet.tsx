'use client';

import { useRouter } from 'next/navigation';

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSheet({ isOpen, onClose }: UploadSheetProps) {
  const router = useRouter();

  if (!isOpen) return null;

  function handleUploadFabric() {
    onClose();
    router.push('/dashboard?tab=fabrics&upload=true');
  }

  function handleShareToCommunity() {
    onClose();
    router.push('/community/new');
  }

  return (
    <>
      <div
        data-testid="upload-sheet-backdrop"
        className="fixed inset-0 z-50 bg-on-surface/20"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl pb-10 pt-3 shadow-elevation-4">
        <div className="w-10 h-1 rounded-full bg-outline-variant mx-auto mb-6" />
        <div className="px-6 space-y-3">
          <button
            type="button"
            onClick={handleUploadFabric}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container transition-colors text-left"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary-golden-glow)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-golden)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Upload Fabric</p>
              <p className="text-xs text-secondary mt-0.5">Add a fabric photo to your library</p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleShareToCommunity}
            className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-surface-container transition-colors text-left"
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-primary-golden-glow)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary-golden)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Share to Community</p>
              <p className="text-xs text-secondary mt-0.5">Post a quilt photo with your story</p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
