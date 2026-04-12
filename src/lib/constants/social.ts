/** Comment and reply display limits */
export const COMMENTS_PER_PAGE = 20;
export const REPLIES_INLINE_LIMIT = 3;

/** Content length caps */
export const MAX_COMMENT_LENGTH = 2000;
export const MAX_BIO_LENGTH = 500;
export const MAX_BLOG_EXCERPT_LENGTH = 300;
export const MAX_BLOG_TAGS = 5;
export const MAX_POST_IMAGES = 4;

/** Community post category slugs */
export const COMMUNITY_CATEGORIES = [
  'show-and-tell',
  'wip',
  'help',
  'inspiration',
  'general',
] as const;

/** Skill level slugs and display labels */
export const SKILL_LEVELS = ['beginner', 'confident-beginner', 'intermediate', 'advanced'] as const;
export const SKILL_LEVEL_LABELS: Record<string, string> = {
  beginner: 'Beginner',
  'confident-beginner': 'Confident Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

/** Tutorial difficulty tiers */
export const TUTORIAL_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

/** Fallback images for social/featured quilt display */
export const SOCIAL_FALLBACK_IMAGES = {
  spotlight: '/images/quilts/quilt_06_wall_art.png',
  medium: '/images/quilts/quilt_01_bed_geometric.png',
  wide: '/images/quilts/quilt_02_bed_hexagon.png',
  small: '/images/quilts/quilt_22_porch_railing.png',
} as const;

/** Support contact */
export const SUPPORT_EMAIL = 'support@quilt.studio';
