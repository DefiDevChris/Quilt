'use client';

import { useAuthStore } from '@/stores/authStore';
import { useCommunityStore } from '@/stores/communityStore';

interface LikeButtonProps {
 postId: string;
 likeCount: number;
 isLikedByUser: boolean;
 size?: 'sm' | 'lg';
}

export function LikeButton({ postId, likeCount, isLikedByUser, size = 'sm' }: LikeButtonProps) {
 const user = useAuthStore((s) => s.user);
 const likePost = useCommunityStore((s) => s.likePost);
 const unlikePost = useCommunityStore((s) => s.unlikePost);

 const iconSize = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
 const textSize = size === 'lg' ? 'text-base' : 'text-xs';

 function handleClick(e: React.MouseEvent) {
 e.stopPropagation();
 e.preventDefault();
 if (!user) {
 window.dispatchEvent(new CustomEvent('quiltcorgi:show-auth-gate'));
 return;
 }

 if (isLikedByUser) {
 unlikePost(postId);
 } else {
 likePost(postId);
 }
 }

 return (
 <button
 type="button"
 onClick={handleClick}
 disabled={!user}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors duration-150 ${isLikedByUser
 ? 'bg-[#ffc7c7]/10 text-[#ffc7c7] hover:bg-[#ffc7c7]/20'
 : 'hover:bg-[#f5f2ef] text-[#6b655e]'
 } ${!user ? 'cursor-default opacity-60' : 'cursor-pointer'}`}
 title={!user ? 'Sign in to like' : isLikedByUser ? 'Unlike' : 'Like'}
 >
 {isLikedByUser ? (
 <svg
 xmlns="http://www.w3.org/2000/svg"
 viewBox="0 0 24 24"
 fill="currentColor"
 className={`${iconSize} text-[#ffc7c7]`}
 >
 <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
 </svg>
 ) : (
 <svg
 xmlns="http://www.w3.org/2000/svg"
 fill="none"
 viewBox="0 0 24 24"
 strokeWidth={1.5}
 stroke="currentColor"
 className={`${iconSize} text-[#6b655e]`}
 >
 <path
 strokeLinecap="round"
 strokeLinejoin="round"
 d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
 />
 </svg>
 )}
 <span
 className={`${textSize} ${isLikedByUser ? 'text-[#ffc7c7] font-medium' : 'text-[#6b655e]'}`}
 >
 {likeCount}
 </span>
 </button>
 );
}
