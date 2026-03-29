import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ postId: string }>;
}

export default async function CommunityPostRedirect({ params }: PageProps) {
  const { postId } = await params;
  redirect(`/socialthreads/${postId}`);
}
