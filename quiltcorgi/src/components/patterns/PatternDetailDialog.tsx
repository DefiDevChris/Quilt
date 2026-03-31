'use client';

import { useEffect, useCallback, useRef, useState, useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePatternStore } from '@/stores/patternStore';
import { formatDimensionDisplay } from '@/components/patterns/PatternCard';
import type { ParsedPiece } from '@/lib/pattern-parser-types';

interface PatternDetailDialogProps {
  patternId: string | null;
  onClose: () => void;
  onImportSuccess: (projectId: string) => void;
}

const SKILL_LEVEL_STYLES: Record<string, { label: string; bg: string; text: string }> = {
  beginner: {
    label: 'Beginner',
    bg: 'rgba(74, 124, 89, 0.12)',
    text: '#4a7c59',
  },
  'confident-beginner': {
    label: 'Confident Beginner',
    bg: 'rgba(59, 105, 149, 0.12)',
    text: '#3b6995',
  },
  intermediate: {
    label: 'Intermediate',
    bg: 'rgba(198, 148, 46, 0.12)',
    text: '#a07824',
  },
  advanced: {
    label: 'Advanced',
    bg: 'rgba(212, 114, 106, 0.12)',
    text: '#b85a53',
  },
};

const COLOR_FAMILY_MAP: Record<string, string> = {
  red: '#D4726A',
  orange: '#E89B6C',
  yellow: '#D4A62E',
  green: '#4a7c59',
  blue: '#3b6995',
  purple: '#7B5EA7',
  pink: '#D48BA0',
  brown: '#8B6B4A',
  black: '#383831',
  white: '#E8DCCB',
  gray: '#9B958C',
  neutral: '#C4B8A8',
  multi: '#C67B5C',
  teal: '#4A8B8D',
  cream: '#F0E4D0',
};

function getColorSwatchHex(colorFamily: string | undefined): string {
  if (!colorFamily) return '#C4B8A8';
  return COLOR_FAMILY_MAP[colorFamily.toLowerCase()] ?? '#C4B8A8';
}

const SHAPE_LABELS: Record<string, string> = {
  square: 'Square',
  rectangle: 'Rectangle',
  hst: 'HST',
  qst: 'QST',
  strip: 'Strip',
  triangle: 'Triangle',
  custom: 'Custom',
};

const LAYOUT_TYPE_LABELS: Record<string, string> = {
  grid: 'Grid',
  'on-point': 'On Point',
  custom: 'Custom',
};

function groupPiecesByFabric(
  blocks: ReadonlyArray<{ name: string; pieces: ReadonlyArray<ParsedPiece> }>
): Map<string, Array<ParsedPiece & { blockName: string }>> {
  const grouped = new Map<string, Array<ParsedPiece & { blockName: string }>>();

  for (const block of blocks) {
    for (const piece of block.pieces) {
      const existing = grouped.get(piece.fabricLabel) ?? [];
      grouped.set(piece.fabricLabel, [...existing, { ...piece, blockName: block.name }]);
    }
  }

  return grouped;
}

export function PatternDetailDialog({
  patternId,
  onClose,
  onImportSuccess,
}: PatternDetailDialogProps) {
  const selectedPattern = usePatternStore((s) => s.selectedPattern);
  const isLoading = usePatternStore((s) => s.isLoading);
  const isImporting = usePatternStore((s) => s.isImporting);
  const error = usePatternStore((s) => s.error);
  const fetchPatternDetail = usePatternStore((s) => s.fetchPatternDetail);
  const importPattern = usePatternStore((s) => s.importPattern);
  const clearSelectedPattern = usePatternStore((s) => s.clearSelectedPattern);
  const clearError = usePatternStore((s) => s.clearError);

  const [importedProjectId, setImportedProjectId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => {
    if (patternId) {
      setImportedProjectId(null);
      clearError();
      fetchPatternDetail(patternId);
    } else {
      clearSelectedPattern();
    }
  }, [patternId, fetchPatternDetail, clearSelectedPattern, clearError]);

  useEffect(() => {
    if (!patternId) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const firstFocusable = dialog.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, [patternId, isLoading]);

  const handleBackdropClick = useCallback(() => {
    if (!isImporting) {
      onClose();
    }
  }, [isImporting, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Escape' && !isImporting) {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [isImporting, onClose]
  );

  const handleImport = useCallback(async () => {
    if (!patternId || isImporting) return;

    const result = await importPattern(patternId);
    if (result) {
      setImportedProjectId(result.projectId);
      onImportSuccess(result.projectId);
    }
  }, [patternId, isImporting, importPattern, onImportSuccess]);

  if (!patternId) return null;

  const pattern = selectedPattern;
  const skill = pattern ? SKILL_LEVEL_STYLES[pattern.skillLevel] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 hidden md:block"
        style={{
          backgroundColor: 'rgba(74, 59, 50, 0.4)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pattern-detail-title"
        onKeyDown={handleKeyDown}
        className="relative w-full h-full md:h-auto md:max-w-[640px] md:max-h-[85vh] overflow-y-auto md:rounded-[var(--radius-xl)]"
        style={{
          backgroundColor: 'var(--color-surface-container-low)',
          boxShadow: 'var(--shadow-elevation-4)',
        }}
      >
        {/* Loading state */}
        {isLoading && !pattern && (
          <div className="p-10 flex flex-col items-center gap-4">
            <div
              className="w-8 h-8 rounded-full animate-spin"
              style={{
                border: '3px solid var(--color-surface-container-high)',
                borderTopColor: 'var(--color-primary)',
              }}
            />
            <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>
              Loading pattern details...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !pattern && (
          <div className="p-10 text-center">
            <p className="text-sm mb-4" style={{ color: 'var(--color-error)' }}>
              {error}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="text-sm font-medium px-4 py-2 rounded-[var(--radius-md)] transition-opacity hover:opacity-80"
              style={{
                backgroundColor: 'var(--color-surface-container)',
                color: 'var(--color-on-surface)',
              }}
            >
              Close
            </button>
          </div>
        )}

        {/* Pattern content */}
        {pattern && skill && (
          <>
            {/* Header */}
            <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h2
                  id="pattern-detail-title"
                  className="text-xl font-bold leading-tight"
                  style={{ color: 'var(--color-on-surface)' }}
                >
                  {pattern.name}
                </h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: skill.bg,
                      color: skill.text,
                    }}
                  >
                    {skill.label}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-secondary)' }}>
                    {formatDimensionDisplay(pattern.finishedWidth)}&Prime; &times;{' '}
                    {formatDimensionDisplay(pattern.finishedHeight)}&Prime;
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer"
                style={{ color: 'var(--color-secondary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-surface-container)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            {/* Description */}
            {pattern.description && (
              <div className="px-4 md:px-6 pb-4">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-secondary)' }}>
                  {pattern.description}
                </p>
              </div>
            )}

            {/* Fabric Requirements */}
            {pattern.patternData.fabrics.length > 0 && (
              <div className="px-4 md:px-6 pb-5">
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--color-on-surface)' }}
                >
                  Fabric Requirements
                </h3>
                <div
                  className="rounded-[var(--radius-md)] overflow-hidden"
                  style={{ backgroundColor: 'var(--color-surface-container)' }}
                >
                  {/* Table header */}
                  <div
                    className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-x-3 md:gap-x-4 px-3 md:px-4 py-2 text-xs font-semibold"
                    style={{ color: 'var(--color-secondary)' }}
                  >
                    <span>Label</span>
                    <span>Name</span>
                    <span className="hidden md:inline">Role</span>
                    <span className="text-right">Yardage</span>
                  </div>
                  {/* Table rows */}
                  {pattern.patternData.fabrics.map((fabric, i) => (
                    <div
                      key={fabric.label}
                      className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_1fr_auto_auto] gap-x-3 md:gap-x-4 px-3 md:px-4 py-2.5 text-sm items-center"
                      style={{
                        backgroundColor:
                          i % 2 === 0
                            ? 'var(--color-surface-container)'
                            : 'var(--color-surface-container-high)',
                        color: 'var(--color-on-surface)',
                      }}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <span
                          className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getColorSwatchHex(fabric.colorFamily) }}
                        />
                        {fabric.label}
                      </span>
                      <span className="truncate">{fabric.name}</span>
                      <span
                        className="hidden md:inline text-xs capitalize"
                        style={{ color: 'var(--color-secondary)' }}
                      >
                        {fabric.role}
                      </span>
                      <span className="text-right font-medium tabular-nums">
                        {fabric.yardage} yd
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Block Summary */}
            {pattern.patternData.blocks.length > 0 && (
              <div className="px-4 md:px-6 pb-5">
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--color-on-surface)' }}
                >
                  Block Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {pattern.patternData.blocks.map((block) => (
                    <div
                      key={block.name}
                      className="rounded-[var(--radius-md)] px-3 py-2.5"
                      style={{
                        backgroundColor: 'var(--color-surface-container)',
                      }}
                    >
                      <p
                        className="text-sm font-medium truncate"
                        style={{ color: 'var(--color-on-surface)' }}
                        title={block.name}
                      >
                        {block.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-secondary)' }}>
                        {formatDimensionDisplay(block.finishedWidth)}&Prime; &times;{' '}
                        {formatDimensionDisplay(block.finishedHeight)}&Prime;
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                        Qty: {block.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cutting Chart Preview */}
            {pattern.patternData.blocks.length > 0 && (
              <div className="px-4 md:px-6 pb-5">
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: 'var(--color-on-surface)' }}
                >
                  Cutting Chart
                </h3>
                <div className="space-y-3">
                  {Array.from(groupPiecesByFabric(pattern.patternData.blocks)).map(
                    ([fabricLabel, pieces]) => (
                      <div key={fabricLabel}>
                        <p
                          className="text-xs font-semibold mb-1.5 flex items-center gap-2"
                          style={{ color: 'var(--color-on-surface)' }}
                        >
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: getColorSwatchHex(
                                pattern.patternData.fabrics.find((f) => f.label === fabricLabel)
                                  ?.colorFamily
                              ),
                            }}
                          />
                          {fabricLabel}
                        </p>
                        <div
                          className="rounded-[var(--radius-sm)] overflow-hidden"
                          style={{
                            backgroundColor: 'var(--color-surface-container)',
                          }}
                        >
                          {pieces.map((piece, i) => (
                            <div
                              key={`${piece.blockName}-${piece.shape}-${piece.cutWidth}-${piece.cutHeight}-${i}`}
                              className="flex items-center justify-between px-3 py-1.5 text-xs"
                              style={{
                                backgroundColor:
                                  i % 2 === 0
                                    ? 'var(--color-surface-container)'
                                    : 'var(--color-surface-container-high)',
                                color: 'var(--color-on-surface)',
                              }}
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="font-medium"
                                  style={{ color: 'var(--color-secondary)' }}
                                >
                                  {SHAPE_LABELS[piece.shape] ?? piece.shape}
                                </span>
                                <span>
                                  {formatDimensionDisplay(piece.cutWidth)}&Prime; &times;{' '}
                                  {formatDimensionDisplay(piece.cutHeight)}&Prime;
                                </span>
                              </span>
                              <span className="font-medium tabular-nums">
                                &times;{piece.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Layout Info */}
            <div className="px-4 md:px-6 pb-5">
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--color-on-surface)' }}
              >
                Layout
              </h3>
              <div
                className="rounded-[var(--radius-md)] px-3 md:px-4 py-3 flex flex-wrap items-center gap-2 md:gap-4"
                style={{
                  backgroundColor: 'var(--color-surface-container)',
                }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--color-on-surface)' }}>
                  {LAYOUT_TYPE_LABELS[pattern.patternData.layout.type] ??
                    pattern.patternData.layout.type}
                </span>
                {pattern.patternData.layout.rows != null &&
                  pattern.patternData.layout.cols != null && (
                    <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                      {pattern.patternData.layout.rows} rows &times;{' '}
                      {pattern.patternData.layout.cols} cols
                    </span>
                  )}
                {pattern.patternData.layout.sashingWidth != null &&
                  pattern.patternData.layout.sashingWidth > 0 && (
                    <span className="text-xs" style={{ color: 'var(--color-secondary)' }}>
                      Sashing: {formatDimensionDisplay(pattern.patternData.layout.sashingWidth)}
                      &Prime;
                    </span>
                  )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 md:px-6 pb-6">
              {error && (
                <p className="text-sm mb-3 text-center" style={{ color: 'var(--color-error)' }}>
                  {error}
                </p>
              )}

              {importedProjectId ? (
                <Link
                  href={`/studio/${importedProjectId}`}
                  className="flex items-center justify-center w-full rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: 'var(--color-success)',
                    color: '#ffffff',
                  }}
                >
                  Project created! Open in Studio &rarr;
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={handleImport}
                  disabled={isImporting}
                  className="flex items-center justify-center w-full rounded-[var(--radius-md)] px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-primary-on)',
                  }}
                >
                  {isImporting ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full animate-spin"
                        style={{
                          border: '2px solid rgba(74, 59, 50, 0.3)',
                          borderTopColor: 'var(--color-primary-on)',
                        }}
                      />
                      Importing...
                    </span>
                  ) : (
                    'Open as New Project'
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
