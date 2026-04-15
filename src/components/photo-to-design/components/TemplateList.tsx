'use client';

import { usePhotoDesignStore } from '@/stores/photoDesignStore';
import type { ShapeTemplate } from '@/types/photo-to-design';

export function TemplateList() {
  const templates = usePhotoDesignStore((s) => s.templates);
  const patches = usePhotoDesignStore((s) => s.patches);
  const selectedPatchId = usePhotoDesignStore((s) => s.selectedPatchId);
  const setSelectedPatchId = usePhotoDesignStore((s) => s.setSelectedPatchId);
  const grid = usePhotoDesignStore((s) => s.grid);

  if (!templates || templates.length === 0) {
    return (
      <div className="p-4 text-[13px] text-[#4a4a4a]">
        Templates appear here after analysis.
      </div>
    );
  }

  const totalPatches = patches?.length ?? 0;
  const selectedTemplateId =
    selectedPatchId !== null
      ? (patches?.find((p) => p.id === selectedPatchId)?.templateId ?? null)
      : null;

  return (
    <div className="flex flex-col gap-3 p-4">
      <div className="text-[13px] text-[#4a4a4a]">
        Found{' '}
        <span className="font-semibold text-[#1a1a1a]">
          {totalPatches} patches, {templates.length} templates
        </span>
      </div>
      {grid && grid.type !== 'none' && (
        <div className="text-[12px] text-[#4a4a4a]">
          Grid: <span className="font-medium text-[#1a1a1a]">{grid.type}</span>
          {grid.confidence > 0 && ` — ${(grid.confidence * 100).toFixed(0)}% confidence`}
        </div>
      )}

      <ul className="flex flex-col gap-1">
        {templates.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => {
                // Select the first patch with this templateId to highlight the row.
                const first = patches?.find((p) => p.templateId === t.id);
                if (first) setSelectedPatchId(first.id);
              }}
              className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors duration-150 ${
                selectedTemplateId === t.id
                  ? 'border-[#ff8d49] bg-[#ff8d49]/5'
                  : 'border-[#d4d4d4] hover:bg-[#ff8d49]/5'
              }`}
            >
              <TemplateSvg template={t} />
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[#1a1a1a]">{t.name}</div>
                <div className="text-[11px] text-[#4a4a4a]">{t.instanceCount}×</div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TemplateSvg({ template }: { template: ShapeTemplate }) {
  const size = 24;
  const poly = template.normalizedPolygon;
  if (!poly || poly.length < 3) {
    return <div className="h-6 w-6 rounded bg-[#d4d4d4]" aria-hidden="true" />;
  }
  // Normalized polygon points are centered on origin in roughly [-1, 1].
  const points = poly
    .map((p) => `${(p.x * (size / 2 - 2) + size / 2).toFixed(2)},${(p.y * (size / 2 - 2) + size / 2).toFixed(2)}`)
    .join(' ');
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <polygon points={points} fill="#ff8d49" fillOpacity={0.2} stroke="#1a1a1a" strokeWidth={1} />
    </svg>
  );
}
