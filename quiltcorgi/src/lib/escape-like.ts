/**
 * Escape LIKE/ILIKE wildcard characters in a search string.
 * Prevents `%` and `_` from being interpreted as wildcards.
 */
export function escapeLikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}
