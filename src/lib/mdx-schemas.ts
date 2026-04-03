import { z } from 'zod';

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

export interface BlogEntry extends BlogFrontmatter {
  readonly content: string;
}
