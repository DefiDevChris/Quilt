interface ExportDialogShellProps {
  /** Dialog title, e.g. "Export PDF" */
  title: string;
  /** Called when the main export/generate action is triggered */
  onExport: () => void;
  /** Called when the dialog is dismissed */
  onClose: () => void;
  /** Whether the export/generate is in progress */
  isExporting: boolean;
  /** Whether the export button should be disabled */
  isDisabled?: boolean;
  /** Label for the export button */
  exportLabel?: string;
  /** Optional error message displayed above the action buttons */
  error?: string;
  /** Slot for mode/option selectorss, paper size pickers, info panels, etc. */
  children: React.ReactNode;
}

export function ExportDialogShell({
  title,
  onExport,
  onClose,
  isExporting,
  isDisabled = false,
  exportLabel = 'Export & Download',
  error,
  children,
}: ExportDialogShellProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[440px] max-w-[90vw] rounded-full bg-neutral p-6 shadow-elevation-2">
        <h2 className="mb-4 text-lg font-semibold text-neutral-800">{title}</h2>

        {children}

        {/* Error */}
        {error && <p className="mb-3 text-xs text-error">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-800 hover:bg-neutral"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={isDisabled}
            className="flex items-center gap-2 rounded-full bg-neutral px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 border border-neutral-200"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              exportLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
