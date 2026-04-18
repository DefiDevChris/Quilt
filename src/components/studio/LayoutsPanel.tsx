/**
 * Layouts Panel Component
 *
 * Contextual left panel for Layout mode projects.
 * Two views: families (initial) and presets (drill-in).
 * Each view is dismissible with X.
 */

import { useCallback } from 'react';
import { useLeftPanelStore, type LeftPanelMode } from '@/stores/leftPanelStore';
import { LAYOUT_TYPE_CARDS } from '@/lib/layout-type-cards';
import { LAYOUT_PRESETS } from '@/lib/layout-library';
import { LayoutThumbnail, getPresetThumbnail } from '@/lib/layout-thumbnail';
import type { LayoutType } from '@/lib/layout-utils';

interface LayoutsPanelProps {
  onDismiss: () => void;
}

const LAYOUT_FAMILIES: Array<{ type: LayoutType; card: typeof LAYOUT_TYPE_CARDS[0] }> = [
  { type: 'grid', card: LAYOUT_TYPE_CARDS[0] },
  { type: 'sashing', card: LAYOUT_TYPE_CARDS[1] },
  { type: 'on-point', card: LAYOUT_TYPE_CARDS[2] },
  { type: 'medallion', card: LAYOUT_TYPE_CARDS[4] },
  { type: 'strippy', card: LAYOUT_TYPE_CARDS[3] },
];

function getFamilyPresets(family: LayoutType) {
  return LAYOUT_PRESETS.filter((p) => p.category === family);
}

function getDefaultPreset(family: LayoutType): string {
  const presets = getFamilyPresets(family);
  return presets[0]?.id ?? '';
}

export function LayoutsPanel({ onDismiss }: LayoutsPanelProps) {
  const layoutBrowserView = useLeftPanelStore((s) => s.layoutBrowserView);
  const selectedFamily = useLeftPanelStore((s) => s.selectedFamily);
  const selectedPresetId = useLeftPanelStore((s) => s.selectedPresetId);
  const drillIntoFamily = useLeftPanelStore((s) => s.drillIntoFamily);
  const backToFamilies = useLeftPanelStore((s) => s.backToFamilies);
  const selectPreset = useLeftPanelStore((s) => s.selectPreset);
  const startPreview = useLeftPanelStore((s) => s.startPreview);

  const handleFamilyClick = useCallback((family: LayoutType) => {
    drillIntoFamily(family);
    const defaultPreset = getDefaultPreset(family);
    if (defaultPreset) {
      selectPreset(defaultPreset);
    }
  }, [drillIntoFamily, selectPreset]);

  const handlePresetClick = useCallback((presetId: string) => {
    selectPreset(presetId);
  }, [selectPreset]);

  return (
    <div className="w-[280px] h-full bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden">
      {layoutBrowserView === 'families' ? (
        <FamiliesView onFamilyClick={handleFamilyClick} onDismiss={onDismiss} />
      ) : (
        <PresetsView
          family={selectedFamily}
          selectedPresetId={selectedPresetId}
          onPresetClick={handlePresetClick}
          onBack={backToFamilies}
          onDismiss={onDismiss}
        />
      )}
    </div>
  );
}

interface FamiliesViewProps {
  onFamilyClick: (family: LayoutType) => void;
  onDismiss: () => void;
}

function FamiliesView({ onFamilyClick, onDismiss }: FamiliesViewProps) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]/50">
        <h2 className="text-[16px] font-semibold text-[var(--color-text)]">Pick a layout</h2>
        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-1 gap-3">
          {LAYOUT_FAMILIES.map(({ type, card }) => (
            <button
              key={type}
              type="button"
              onClick={() => onFamilyClick(type)}
              className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface)] transition-colors text-left"
            >
              <div className="w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-[var(--color-bg)]">
                <LayoutThumbnail type={type} rows={3} cols={3} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-[14px] font-semibold text-[var(--color-text)] truncate">{card.name}</h3>
                <p className="text-[12px] text-[var(--color-text-dim)] line-clamp-2 mt-0.5">{card.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

interface PresetsViewProps {
  family: LayoutType | null;
  selectedPresetId: string | null;
  onPresetClick: (presetId: string) => void;
  onBack: () => void;
  onDismiss: () => void;
}

function PresetsView({ family, selectedPresetId, onPresetClick, onBack, onDismiss }: PresetsViewProps) {
  if (!family) return null;
  
  const presets = getFamilyPresets(family);
  const card = LAYOUT_TYPE_CARDS.find((c) => c.id === family);

  return (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]/50">
        <button
          type="button"
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Back to families"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-[16px] font-semibold text-[var(--color-text)] flex-1">{card?.name ?? 'Layout'}</h2>
        <button
          type="button"
          onClick={onDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-border)]/30 transition-colors"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-3">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onPresetClick(preset.id)}
              className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                selectedPresetId === preset.id
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                  : 'border-[var(--color-border)]/30 hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-bg)]'
              }`}
            >
              <div className="w-full aspect-square rounded-md overflow-hidden bg-[var(--color-bg)] mb-2">
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: getPresetThumbnail(preset.id) }}
                />
              </div>
              <span className={`text-[12px] font-medium ${
                selectedPresetId === preset.id ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'
              }`}>
                {preset.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}