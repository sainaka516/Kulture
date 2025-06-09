export interface User {
  id: string;
  name: string;
  username: string;
  image: string | null;
  verified: boolean;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  parent?: Community;
  _count?: {
    members: number;
  };
}

export interface Take {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: User;
  community: Community;
  _count?: {
    comments: number;
    upvotes: number;
    downvotes: number;
  };
  userVote?: 'UP' | 'DOWN' | null;
}

export interface Vote {
  id: string;
  type: 'UP' | 'DOWN';
  userId: string;
  takeId: string;
} 