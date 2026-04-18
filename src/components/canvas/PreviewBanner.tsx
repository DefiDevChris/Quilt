/**
 * Preview Banner Component
 *
 * Renders at top of canvas when a preview is active.
 * Shows "Previewing '[name]' · [Apply] [Cancel]"
 */

import { useLeftPanelStore } from '@/stores/leftPanelStore';

export function PreviewBanner() {
  const previewName = useLeftPanelStore((s) => s.previewName);
  const applyPreview = useLeftPanelStore((s) => s.applyPreview);
  const cancelPreview = useLeftPanelStore((s) => s.cancelPreview);

  if (!previewName) {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-center bg-[#1a1a1a]/90 backdrop-blur-sm py-2 px-4">
      <span className="text-[14px] text-[#faf9f7] font-medium mr-4">
        Previewing &lsquo;{previewName}&rsquo;
      </span>
      <button
        type="button"
        onClick={applyPreview}
        className="px-4 py-1.5 bg-[#f08060] text-[#1a1a1a] text-[14px] font-semibold rounded-full hover:bg-[#d97054] transition-colors mr-2"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={cancelPreview}
        className="px-4 py-1.5 border-2 border-[#faf9f7]/30 text-[#faf9f7] text-[14px] font-medium rounded-full hover:bg-[#faf9f7]/10 transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}