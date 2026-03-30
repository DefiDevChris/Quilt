/**
 * Shared formatting utilities.
 */

/**
 * Format a full name as "First L." for privacy-friendly display.
 * Single-word names are returned as-is. Empty/null returns ''.
 */
export function formatCreatorName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] ?? '';
  return `${parts[0]} ${parts[1]![0]}.`;
}
