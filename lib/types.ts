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
  title?: string
  description?: string
  rules?: string
  createdAt: Date
  updatedAt: Date
  ownerId: string
  parent?: Community | null
  _count?: {
    members: number
    takes: number
    children: number
  }
}

export interface Take {
  id: string
  title: string
  content: string | null
  createdAt: Date | string
  updatedAt: Date | string
  currentUserId?: string
  author: {
    id: string
    name: string | null
    username: string
    image: string | null
    verified?: boolean
  }
  community: {
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
  }
  votes: Array<{
    id: string
    type: 'UP' | 'DOWN'
    userId: string
  }>
  userVote?: 'UP' | 'DOWN' | null
  _count?: {
    comments: number
    upvotes: number
    downvotes: number
  }
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