'use client';

interface UploadSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadSheet({ isOpen, onClose }: UploadSheetProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full bg-surface rounded-t-2xl p-6 pb-10" onClick={(e) => e.stopPropagation()}>
        <p className="text-center text-secondary text-sm">Upload sheet — coming soon</p>
      </div>
    </div>
  );
}
