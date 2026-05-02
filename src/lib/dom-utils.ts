/**
 * DOM utility functions for common checks and operations.
 */

/**
 * Check if an element is an input element that should receive keyboard events.
 * Used to guard keyboard shortcuts from activating when user is typing.
 *
 * @param target - The event target to check
 * @returns true if the target is an input, textarea, or contenteditable element
 *
 * @example
 * function onKeyDown(e: KeyboardEvent) {
 *   if (isInputElement(e.target)) return;
 *   // Handle keyboard shortcut...
 * }
 */
export function isInputElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

/**
 * Download a PDF blob to the user's device.
 *
 * @param pdfBytes - The PDF data as Uint8Array
 * @param filename - The name for the downloaded file
 */
export function downloadPdf(pdfBytes: Uint8Array, filename: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
