export interface CommunityPost {
  id: string;
  userId: string;
  projectId: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

export interface CommunityPostListItem {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
  likeCount: number;
  creatorName: string;
  createdAt: Date;
  isLikedByUser: boolean;
}
