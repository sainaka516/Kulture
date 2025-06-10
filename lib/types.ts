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

export interface Vote {
  type: 'UP' | 'DOWN'
  id: string
  userId: string
  takeId: string
  createdAt: Date
  updatedAt: Date
}

export interface Take {
  id: string
  title: string
  content: string | null
  createdAt: string | Date
  updatedAt: string | Date
  communityId: string
  authorId: string
  community: {
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
          takes: number
          children: number
          members: number
        }
      } | null
      _count?: {
        takes: number
        children: number
        members: number
      }
    } | null
    _count: {
      takes: number
      children: number
      members: number
    }
  }
  author: {
    id: string
    name: string | null
    username: string
    image: string | null
    verified: boolean
  }
  votes: (Vote & {
    createdAt: string | Date
    updatedAt: string | Date
  })[]
  _count: {
    upvotes: number
    downvotes: number
    comments: number
  }
  userVote?: 'UP' | 'DOWN' | null
  verifiedCount?: number
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