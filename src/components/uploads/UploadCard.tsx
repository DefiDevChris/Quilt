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
  unassigned: 'bg-outline-variant/30 text-secondary',
  fabric: 'bg-primary/10 text-primary',
  block: 'bg-success/10 text-success',
  quilt: 'bg-warning/10 text-warning',
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
    <div className="glass-panel rounded-2xl overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-surface-container overflow-hidden">
        <Image
          src={upload.imageUrl}
          alt={displayName}
          fill
          className="object-cover"
          unoptimized
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {upload.status === 'processing' && (
          <div className="absolute inset-0 bg-on-surface/40 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" className="animate-spin text-white">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray="40 20"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 space-y-2.5">
        <p className="text-sm font-medium text-on-surface truncate" title={displayName}>
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
              className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${
                upload.assignedType === opt.value
                  ? TYPE_COLORS[opt.value]
                  : 'bg-transparent text-secondary/60 hover:bg-surface-container'
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
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-orange-500 to-rose-400 text-white disabled:opacity-40 hover:opacity-90 transition-all"
          >
            {processing ? 'Opening...' : 'Process'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
              confirmDelete
                ? 'bg-error/10 text-error'
                : 'bg-white/50 text-secondary hover:text-error hover:bg-error/10'
            }`}
          >
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
