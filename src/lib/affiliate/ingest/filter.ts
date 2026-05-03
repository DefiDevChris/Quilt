import type { RawProduct } from './types';

const QUILTING_COTTON_RULES: Record<
  string,
  {
    categoryAllowlist: string[];
    titleBlockKeywords: string[];
  }
> = {
  'fat-quarter-shop': {
    categoryAllowlist: [
      'Yardage',
      'Pre-Cuts',
      'Bundles',
      'Backings',
      'Solids',
      'Batiks',
    ],
    titleBlockKeywords: [
      'Pattern',
      'Book',
      'Notion',
      'Thread',
      'Batting',
      'Needle',
      'Ruler',
      'Tool',
      'DVD',
      'Magazine',
      'Kit',
      'Subscription',
    ],
  },
  'connecting-threads': {
    categoryAllowlist: [
      'Quilting Fabric',
      'Cotton Fabric',
      'Pre-Cut Fabric',
      'Solids',
      'Wide Backing',
      'Bundles',
    ],
    titleBlockKeywords: [
      'Pattern',
      'Book',
      'Notion',
      'Thread',
      'Batting',
      'Needle',
      'Ruler',
      'Tool',
      'Marker',
      'Magazine',
      'Subscription',
      'Class',
    ],
  },
};

export function isQuiltingCotton(raw: RawProduct, retailerSlug: string): boolean {
  const rules = QUILTING_COTTON_RULES[retailerSlug];
  if (!rules) return true;

  const nameLower = raw.name.toLowerCase();

  for (const keyword of rules.titleBlockKeywords) {
    if (nameLower.includes(keyword.toLowerCase())) return false;
  }

  if (raw.category) {
    const catLower = raw.category.toLowerCase();
    const matchesAllowlist = rules.categoryAllowlist.some((allowed) =>
      catLower.includes(allowed.toLowerCase()),
    );
    if (matchesAllowlist) return true;
  }

  return true;
}
