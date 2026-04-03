import { randomBytes } from 'crypto';

export function generateUsername(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  const suffix = randomBytes(2).toString('hex');

  const truncated = base.slice(0, 55);

  return `${truncated}-${suffix}`;
}
