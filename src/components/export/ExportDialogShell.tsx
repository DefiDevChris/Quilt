import { LAYOUT, COLORS, COLORS_HOVER } from '@/lib/design-system';
import { useFocusTrap } from '@/hooks/useFocusTrap';

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
  const dialogRef = useFocusTrap<HTMLDivElement>(true, onClose);
  const dialogId = `export-dialog-title-${title.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-text)]/40"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={dialogId}
        tabIndex={-1}
        className={`w-[${LAYOUT.dialogMd}] max-w-[90vw] rounded-lg bg-[var(--color-bg)] p-6 shadow-[0_1px_2px_rgba(26,26,26,0.08)] border border-[var(--color-border)] outline-none`}
      >
        <h2 id={dialogId} className="mb-4 text-lg font-semibold text-[var(--color-text)]">
          {title}
        </h2>

        {children}

        {/* Error */}
        {error && <p className="mb-3 text-xs text-[var(--color-accent)]">{error}</p>}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-bg)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onExport}
            disabled={isDisabled}
            className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 animation-spinner rounded-full border-2 border-[var(--color-bg)] border-t-transparent" />
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
