import type { Metadata } from 'next';
import { getAllBlogPosts, getAllBlogTags } from '@/lib/mdx-engine';
import { BlogGrid } from '@/components/blog/BlogGrid';

export const metadata: Metadata = {
  title: 'Blog | QuiltCorgi',
  description:
    'News, tips, and behind-the-scenes updates from the QuiltCorgi team. Learn about quilt design, new features, and the quilting community.',
};

export default function BlogPage() {
  const posts = getAllBlogPosts();
  const allTags = getAllBlogTags();

  const postFrontmatters = posts.map(({ content: _content, ...frontmatter }) => frontmatter);

  return (
    <>
      <h1 className="text-headline-lg font-bold text-on-surface mb-2">Blog</h1>
      <p className="text-body-lg text-secondary mb-8">
        News, tips, and updates from the QuiltCorgi team.
      </p>
      <BlogGrid initialPosts={postFrontmatters} allTags={[...allTags]} />
    </>
  );
}
