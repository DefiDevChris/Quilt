'use client';

import { useEffect, useState } from 'react';
import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import { PhotoDesignClient } from '@/lib/photo-to-design/client';
import { StatusBar } from '@/components/photo-to-design/StatusBar';
import { UploadScreen } from '@/components/photo-to-design/screens/UploadScreen';
import { PerspectiveScreen } from '@/components/photo-to-design/screens/PerspectiveScreen';
import { CalibrateScreen } from '@/components/photo-to-design/screens/CalibrateScreen';
import { ReviewScreen } from '@/components/photo-to-design/screens/ReviewScreen';

export function PhotoDesignApp() {
  const stage = usePhotoDesignStore((s) => s.stage);
  const error = usePhotoDesignStore((s) => s.error);
  const clearError = usePhotoDesignStore((s) => s.clearError);

  const [client, setClient] = useState<PhotoDesignClient | null>(null);

  // Initialize client on mount, dispose on unmount.
  // Unmount must: (1) send dispose to worker so WASM heap frees, (2) revoke
  // every object URL the store is tracking, (3) reset store state.
  useEffect(() => {
    const c = new PhotoDesignClient();
    setClient(c);
    c.call('init').catch(() => {
      // Error will be surfaced via worker onerror handler
    });
    return () => {
      // Fire-and-forget dispose message to the worker, then terminate.
      void c.disposeWorker();
      usePhotoDesignStore.getState().dispose();
    };
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[#faf9f7]">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-[#d4d4d4] bg-[#ffffff] px-4 py-3">
        <h1 className="text-[24px] leading-[32px] font-semibold text-[#1a1a1a]">Photo to Design</h1>
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-[#d4d4d4] bg-[#ffffff] px-4 py-2 shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
            <span className="text-[14px] text-[#ed4956]">{error.message}</span>
            {error.recoverable && (
              <button
                type="button"
                onClick={clearError}
                className="rounded-full px-3 py-1 text-[12px] text-[#ff8d49] transition-colors duration-150 hover:bg-[#ff8d49]/10"
              >
                Dismiss
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main content — state-machine driven screen rendering.
          pb-16 reserves space for the fixed-bottom StatusBar so primary CTAs
          in each screen are not intercepted by the stepper. */}
      <main className="flex-1 overflow-hidden pb-16">
        {stage === 'upload' && <UploadScreen />}
        {stage === 'perspective' && <PerspectiveScreen client={client} />}
        {stage === 'calibrate' && <CalibrateScreen client={client} />}
        {stage === 'review' && <ReviewScreen client={client} />}
        {stage === 'export' && (
          <div className="flex h-full items-center justify-center">
            <p className="text-[18px] text-[#4a4a4a]">Opening Studio…</p>
          </div>
        )}
      </main>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
