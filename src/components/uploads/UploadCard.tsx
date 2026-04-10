'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MobileUpload, MobileUploadAssignedType } from '@/types/mobile-upload';

const TYPE_OPTIONS: { value: MobileUploadAssignedType; label: string }[] = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'fabric', label: 'Fabric' },
  { value: 'block', label: 'Block' },
  { value: 'quilt', label: 'Quilt' },
];

const TYPE_COLORS: Record<MobileUploadAssignedType, string> = {
  unassigned: 'bg-[#e8e1da]/50 text-[#6b655e]',
  fabric: 'bg-[#ff8d49]/10 text-[#ff8d49]',
  block: 'bg-[#ff8d49]/10 text-[#ff8d49]',
  quilt: 'bg-[#ff8d49]/10 text-[#ff8d49]',
};

interface UploadCardProps {
  upload: MobileUpload;
  onUpdateType: (id: string, type: MobileUploadAssignedType) => void;
  onProcess: (id: string, type: 'fabric' | 'block' | 'quilt') => void;
  onDelete: (id: string) => void;
}

export function UploadCard({ upload, onUpdateType, onProcess, onDelete }: UploadCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [processing, setProcessing] = useState(false);

  const displayName =
    upload.originalFilename?.replace(/\.[^.]+$/, '') ??
    `Upload ${new Date(upload.createdAt).toLocaleDateString()}`;

  const canProcess = upload.assignedType !== 'unassigned' && upload.status === 'pending';

  async function handleProcess() {
    if (!canProcess || upload.assignedType === 'unassigned') return;
    setProcessing(true);
    onProcess(upload.id, upload.assignedType);
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    onDelete(upload.id);
  }

  return (
    <div className="bg-[#ffffff] border border-[#e8e1da] rounded-lg overflow-hidden group shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-[#fdfaf7] overflow-hidden">
        <Image
          src={upload.imageUrl}
          alt={displayName}
          fill
          className="object-cover"
          unoptimized
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {upload.status === 'processing' && (
          <div className="absolute inset-0 bg-[#2d2a26]/40 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-[#ffffff]/20 animate-pulse" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 space-y-2.5">
        <p className="text-sm font-medium text-[#2d2a26] truncate" title={displayName}>
          {displayName}
        </p>

        {/* Type selector */}
        <div className="flex flex-wrap gap-1">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onUpdateType(upload.id, opt.value)}
              disabled={upload.status !== 'pending'}
              className={`px-2 py-0.5 text-xs font-medium rounded-lg transition-colors ${upload.assignedType === opt.value
                ? TYPE_COLORS[opt.value]
                : 'bg-transparent text-[#6b655e]/60 hover:bg-[#e8e1da]/50'
                } disabled:opacity-50`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleProcess}
            disabled={!canProcess || processing}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#ff8d49] text-[#2d2a26] disabled:opacity-40 hover:bg-[#e67d3f] transition-colors duration-150"
          >
            {processing ? 'Opening...' : 'Process'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors duration-150 ${confirmDelete
              ? 'bg-[#ff8d49]/10 text-[#ff8d49]'
              : 'bg-[#e8e1da] text-[#6b655e] hover:bg-[#ff8d49]/10 hover:text-[#ff8d49]'
              }`}
          >
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
