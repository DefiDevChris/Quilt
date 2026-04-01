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
 * Get the active element, safely handling shadow DOM.
 *
 * @param root - The root element to search from (default: document)
 * @returns The active element, or null if none
 */
export function getActiveElement(root: Document | ShadowRoot = document): Element | null {
  const activeElement = root.activeElement;

  if (!activeElement) {
    return null;
  }

  // If the active element has a shadow root, recurse into it
  if (activeElement.shadowRoot) {
    return getActiveElement(activeElement.shadowRoot) ?? activeElement;
  }

  return activeElement;
}

/**
 * Check if the currently focused element is an input element.
 * Useful for global keyboard event handlers.
 *
 * @returns true if the currently focused element is an input
 *
 * @example
 * window.addEventListener('keydown', (e) => {
 *   if (isActiveElementInput()) return;
 *   // Handle global keyboard shortcut...
 * });
 */
export function isActiveElementInput(): boolean {
  const activeElement = getActiveElement();

  if (!(activeElement instanceof HTMLElement)) {
    return false;
  }

  return isInputElement(activeElement);
}
