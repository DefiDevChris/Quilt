export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  followers: number;
  following: number;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
  likes: number;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  image: string;
  comments: Comment[];
  likes: number;
  createdAt: string;
  isFeatured?: boolean;
}

export type ViewMode = 'full' | 'grid';
export type FilterMode = 'featured' | 'newest';
