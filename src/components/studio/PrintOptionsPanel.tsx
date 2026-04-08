'use client';

import { useCanvasStore } from '@/stores/canvasStore';
import { usePrintlistStore } from '@/stores/printlistStore';
import { useYardageStore } from '@/stores/yardageStore';
import { useStudioDialogs } from '@/components/studio/StudioDialogs';

export function PrintOptionsPanel() {
  const showSeamAllowance = useCanvasStore((s) => s.showSeamAllowance);
  const toggleSeamAllowance = useCanvasStore((s) => s.toggleSeamAllowance);
  const printScale = useCanvasStore((s) => s.printScale);
  const setPrintScale = useCanvasStore((s) => s.setPrintScale);
  const dialogs = useStudioDialogs();

  const printOptions = [
    {
      label: 'Printlist',
      description: 'Block overview, patch count & cutting diagram',
      onClick: () => usePrintlistStore.getState().togglePanel(),
    },
    {
      label: 'Yardage Summary',
      description: 'Fabric requirements & yardage calculations',
      onClick: () => useYardageStore.getState().togglePanel(),
    },
    {
      label: 'Export PDF',
      description: 'Full printable PDF package',
      onClick: dialogs.openPdfExport,
    },
    {
      label: 'Export Image',
      description: 'Save as PNG or JPEG',
      onClick: dialogs.openImageExport,
    },
  ];

  return (
    <div className="w-[220px] bg-surface flex-shrink-0 overflow-y-auto border-r border-outline-variant/15">
      <div className="p-4">
        <h3 className="text-label-sm uppercase text-on-surface/70 tracking-[0.02em] font-medium mb-4">
          Print Options
        </h3>

        {/* Print Preview Settings */}
        <div className="mb-4 p-3 bg-surface-container rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-on-surface">Seam Allowance</span>
            <button
              type="button"
              role="switch"
              aria-checked={showSeamAllowance}
              onClick={toggleSeamAllowance}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${showSeamAllowance ? 'bg-primary' : 'bg-outline-variant'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow-elevation-1 transition-transform ${showSeamAllowance ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
              />
            </button>
          </div>

          <div>
            <label className="text-body-sm text-on-surface block mb-1">
              Print Scale: {printScale.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={printScale}
              onChange={(e) => setPrintScale(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-secondary mt-0.5">
              <span>50%</span>
              <span>1:1</span>
              <span>200%</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {printOptions.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className="flex items-center justify-between py-2.5 px-3 text-body-md text-on-surface bg-surface-container rounded-md hover:bg-surface-container-high transition-colors"
            >
              <div className="text-left">
                <span className="block">{item.label}</span>
                <span className="text-body-sm text-secondary">{item.description}</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="flex-shrink-0 ml-2"
              >
                <path
                  d="M6 4L10 8L6 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
