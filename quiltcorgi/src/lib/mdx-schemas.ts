import { z } from 'zod';

export const tutorialFrontmatterSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  description: z.string().max(500),
  estimatedTime: z.string(),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  tags: z.array(z.string()),
  featuredImage: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

export type TutorialFrontmatter = z.infer<typeof tutorialFrontmatterSchema>;

export const blogFrontmatterSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100),
  description: z.string().max(500),
  author: z.string().min(1),
  publishedAt: z.string(),
  updatedAt: z.string().optional(),
  tags: z.array(z.string()),
  featuredImage: z.string().optional(),
  excerpt: z.string().max(300).optional(),
});

export type BlogFrontmatter = z.infer<typeof blogFrontmatterSchema>;

export interface TutorialEntry extends TutorialFrontmatter {
  readonly content: string;
}

export interface BlogEntry extends BlogFrontmatter {
  readonly content: string;
}

export const DIFFICULTY_ORDER = {
  beginner: 0,
  intermediate: 1,
  advanced: 2,
} as const;
