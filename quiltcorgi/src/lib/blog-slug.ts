/**
 * Generate a URL-friendly slug from a blog post title.
 * Lowercases, replaces spaces with hyphens, strips special characters,
 * and truncates to a maximum of 200 characters.
 */
export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug.slice(0, 200);
}

/**
 * Append a random 4-character hex suffix to a slug to ensure uniqueness.
 */
export function appendSlugSuffix(slug: string): string {
  const { randomBytes } = require('crypto') as typeof import('crypto');
  const suffix = randomBytes(2).toString('hex');
  const base = slug.slice(0, 195);
  return `${base}-${suffix}`;
}
