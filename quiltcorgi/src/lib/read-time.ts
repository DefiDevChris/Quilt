export function calculateReadTime(content: unknown): number {
  const charCount = JSON.stringify(content ?? '').length;
  return Math.max(1, Math.ceil(charCount / 1500));
}
