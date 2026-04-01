import { getAllBlogPosts, getBlogSlugs } from '@/lib/mdx-utils';

describe('mdx-utils', () => {
  it('returns array from getBlogSlugs', () => {
    const slugs = getBlogSlugs();
    expect(Array.isArray(slugs)).toBe(true);
  });

  it('returns array from getAllBlogPosts', () => {
    const posts = getAllBlogPosts();
    expect(Array.isArray(posts)).toBe(true);
  });
});
