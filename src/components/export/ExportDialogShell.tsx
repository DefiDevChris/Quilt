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
 <div className="w-[440px] max-w-[90vw] rounded-lg bg-[#fdfaf7] p-6 shadow-[0_1px_2px_rgba(45,42,38,0.08)]">
 <h2 className="mb-4 text-lg font-semibold text-[#2d2a26]">{title}</h2>

 {children}

 {/* Error */}
 {error && <p className="mb-3 text-xs text-[#ffc7c7]">{error}</p>}

 {/* Actions */}
 <div className="flex justify-end gap-2">
 <button
 type="button"
 onClick={onClose}
 disabled={isExporting}
 className="rounded-lg border border-[#e8e1da] bg-[#ffffff] px-4 py-2 text-sm text-[#2d2a26] hover:bg-[#fdfaf7]"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={onExport}
 disabled={isDisabled}
 className="flex items-center gap-2 rounded-lg bg-[#ff8d49] px-4 py-2 text-sm font-medium text-[#2d2a26] hover:bg-[#e67d3f] disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-150"
 >
 {isExporting ? (
 <>
 <div className="h-4 w-4 animation-spinner rounded-full border-2 border-[#fdfaf7] border-t-transparent" />
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
