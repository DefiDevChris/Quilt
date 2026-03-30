import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Studio | QuiltCorgi',
};

export default function StudioIndexPage() {
  redirect('/dashboard');
}
