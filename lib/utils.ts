import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string) {
  return format(new Date(date), 'MMMM yyyy')
}

export function transformTake(take: any, currentUserId?: string | null) {
  return {
    ...take,
    authorId: take.authorId, // Explicitly preserve authorId
    votes: take.votes.map((vote: any) => ({
      ...vote,
      createdAt: vote.createdAt instanceof Date ? vote.createdAt.toISOString() : vote.createdAt,
      updatedAt: vote.updatedAt instanceof Date ? vote.updatedAt.toISOString() : vote.updatedAt,
    })),
    userVote: currentUserId 
      ? (take.votes.find((vote: any) => vote.userId === currentUserId)?.type || null) as "UP" | "DOWN" | null
      : null,
    _count: {
      upvotes: take.votes.filter((vote: any) => vote.type === 'UP').length,
      downvotes: take.votes.filter((vote: any) => vote.type === 'DOWN').length,
      comments: take._count?.comments || 0,
    },
    community: {
      id: take.community.id,
      name: take.community.name,
      slug: take.community.slug,
      _count: take.community._count || {
        takes: 0,
        children: 0,
        members: 0,
      },
      parent: take.community.parent ? {
        id: take.community.parent.id,
        name: take.community.parent.name,
        slug: take.community.parent.slug,
        _count: take.community.parent._count || {
          takes: 0,
          children: 0,
          members: 0,
        },
        parent: take.community.parent.parent ? {
          id: take.community.parent.parent.id,
          name: take.community.parent.parent.name,
          slug: take.community.parent.parent.slug,
          _count: take.community.parent.parent._count || {
            takes: 0,
            children: 0,
            members: 0,
          },
        } : null,
      } : null,
    },
  }
}
