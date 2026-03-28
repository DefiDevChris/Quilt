import type { Metadata } from 'next';
import { BlogEditor } from '@/components/blog/BlogEditor';

export const metadata: Metadata = {
  title: 'Write Blog Post | QuiltCorgi',
  description: 'Write and publish a blog post on QuiltCorgi.',
};

export default function NewBlogPostPage() {
  return <BlogEditor />;
}
