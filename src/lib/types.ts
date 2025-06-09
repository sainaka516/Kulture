export interface User {
  id: string;
  name: string | null;
  username: string;
  verified: boolean;
  image: string | null;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  _count?: {
    members: number;
  };
  parent?: Community | null;
}

export interface Vote {
  id: string;
  type: 'UP' | 'DOWN';
  userId: string;
}

export interface Take {
  id: string;
  title: string;
  content: string | null;
  createdAt: string;
  author: User;
  community: Community;
  votes: Vote[];
  _count: {
    comments: number;
  };
} 