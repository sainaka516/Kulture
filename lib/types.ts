export interface User {
  id: string
  name: string | null
  email: string | null
  username: string
  image: string | null
  verified?: boolean
}

export interface Community {
  id: string
  name: string
  slug: string
  parent?: {
    id: string
    name: string
    slug: string
    parent?: {
      id: string
      name: string
      slug: string
      _count?: {
        members: number
      }
    } | null
    _count?: {
      members: number
    }
  } | null
  children?: {
    id: string
    name: string
    slug: string
    _count?: {
      members: number
    }
    children?: Community[]
  }[]
  _count?: {
    members: number
  }
}

export interface Take {
  id: string
  title: string
  content: string | null
  createdAt: string
  author: {
    id: string
    name: string | null
    username: string
    image: string | null
    verified: boolean
  }
  community: Community
  votes: Array<{
    type: 'UP' | 'DOWN'
    userId: string
  }>
  _count: {
    comments: number
    upvotes: number
    downvotes: number
  }
  currentUserId?: string
  userVote?: 'UP' | 'DOWN' | null
}

export interface Comment {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
  author: User
  takeId: string | null
  take?: Take | null
} 