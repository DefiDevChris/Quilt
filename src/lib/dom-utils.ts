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

