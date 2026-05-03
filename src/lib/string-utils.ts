/**
 * String Utilities
 * Canonical string normalization functions.
 * Pure functions — no dependencies.
 */

import { randomBytes } from 'crypto';

/**
 * Options for sanitizing filenames.
 */
export interface SanitizeFilenameOptions {
  /** Strip file extension (e.g. ".png") before sanitizing. Default: false. */
  stripExtension?: boolean;
  /** Preserve underscores in addition to alphanumeric and hyphens. Default: false. */
  keepUnderscores?: boolean;
  /** Collapse multiple consecutive hyphens into one. Default: false. */
  collapseHyphens?: boolean;
  /** Trim leading/trailing hyphens. Default: false. */
  trimHyphens?: boolean;
  /** Maximum length of the result. Default: no limit. */
  maxLength?: number;
}

/**
 * Sanitize a project/file name for use in exported filenames or storage keys.
 * Strips special characters, replaces spaces with hyphens, lowercases.
 *
 * Supports options for different contexts:
 * - General export filenames: defaults (stripExtension=false, no maxLength)
 * - S3 storage keys: { stripExtension: true, keepUnderscores: true, collapseHyphens: true, trimHyphens: true, maxLength: 64 }
 */
export function sanitizeFilename(name: string, options: SanitizeFilenameOptions = {}): string {
  const {
    stripExtension = false,
    keepUnderscores = false,
    collapseHyphens = false,
    trimHyphens = false,
    maxLength,
  } = options;

  let result = name;

  // Strip extension if requested
  if (stripExtension) {
    result = result.replace(/\.[^.]+$/, '');
  }

  // Replace dots with hyphens as word separators (before stripping other chars)
  // This matches the original S3 behavior where dots became hyphens
  result = result.replace(/\./g, '-');

  // Build the allowed-char pattern: always allow alphanumeric, whitespace, hyphens
  const pattern = keepUnderscores ? /[^a-zA-Z0-9\s-_]/g : /[^a-zA-Z0-9\s-]/g;
  result = result.replace(pattern, '');

  // Replace whitespace with hyphens
  result = result.replace(/\s+/g, '-');

  // Collapse multiple hyphens if requested
  if (collapseHyphens) {
    result = result.replace(/-{2,}/g, '-');
  }

  // Trim leading/trailing hyphens if requested
  if (trimHyphens) {
    result = result.replace(/^-|-$/g, '');
  }

  // Truncate if maxLength is specified
  if (maxLength) {
    result = result.slice(0, maxLength);
  }

  return result.toLowerCase();
}

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

export function appendSlugSuffix(slug: string): string {
  const suffix = randomBytes(2).toString('hex');
  const base = slug.slice(0, 195);
  return `${base}-${suffix}`;
}
