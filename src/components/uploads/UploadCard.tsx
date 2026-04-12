'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MobileUpload, MobileUploadAssignedType } from '@/types/mobile-upload';
import { COLORS, COLORS_HOVER, SHADOW, MOTION } from '@/lib/design-system';

const TYPE_OPTIONS: { value: MobileUploadAssignedType; label: string }[] = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'fabric', label: 'Fabric' },
  { value: 'block', label: 'Block' },
  { value: 'quilt', label: 'Quilt' },
];

const TYPE_COLORS: Record<MobileUploadAssignedType, string> = {
  unassigned: 'bg-[var(--color-border)]/50 text-[var(--color-text-dim)]',
  fabric: '',
  block: '',
  quilt: '',
};

function getTypeColor(type: MobileUploadAssignedType): React.CSSProperties | undefined {
  if (type === 'unassigned') return undefined;
  return { backgroundColor: `${COLORS.primary}1a`, color: COLORS.primary };
}

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
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden group shadow-[0_1px_2px_rgba(26,26,26,0.08)]">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-[var(--color-bg)] overflow-hidden">
        <Image
          src={upload.imageUrl}
          alt={displayName}
          fill
          className="object-cover"
          unoptimized
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        {upload.status === 'processing' && (
          <div className="absolute inset-0 bg-[var(--color-text)]/40 flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)]/20 animate-pulse" />
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3 space-y-2.5">
        <p className="text-[14px] font-medium text-[var(--color-text)] truncate" title={displayName}>
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
              className={`px-2 py-0.5 text-[14px] font-medium rounded-full transition-colors ${upload.assignedType === opt.value
                ? TYPE_COLORS[opt.value]
                : 'bg-transparent text-[var(--color-text-dim)]/60 hover:bg-[var(--color-border)]/50'
                } disabled:opacity-50`}
              style={upload.assignedType === opt.value ? getTypeColor(opt.value) : undefined}
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
            className="flex-1 px-3 py-1.5 text-[14px] font-medium rounded-full text-[var(--color-text)] disabled:opacity-40"
            style={{
              backgroundColor: COLORS.primary,
              transition: `background-color ${MOTION.transitionDuration}ms ${MOTION.transitionEasing}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = COLORS_HOVER.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = COLORS.primary)}
          >
            {processing ? 'Opening...' : 'Process'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className={`px-3 py-1.5 text-[14px] font-medium rounded-full transition-colors duration-150 ${confirmDelete
              ? ''
              : 'border border-[var(--color-border)] text-[var(--color-text-dim)]'
              }`}
            style={confirmDelete
              ? { backgroundColor: `${COLORS.primary}1a`, color: COLORS.primary }
              : undefined}
            onMouseEnter={(e) => {
              if (!confirmDelete) {
                e.currentTarget.style.backgroundColor = `${COLORS.primary}1a`;
                e.currentTarget.style.color = COLORS.primary;
              }
            }}
            onMouseLeave={(e) => {
              if (!confirmDelete) {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.color = '';
              }
            }}
          >
            {confirmDelete ? 'Confirm?' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
