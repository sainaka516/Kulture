import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ExploreClient from './explore-client'

// Make sure data is always fresh
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

async function getTakes() {
  try {
    const session = await getServerSession(authOptions)

    // Get viewed takes for the current user
    const viewedTakeIds = session?.user?.id
      ? (await prisma.viewedTake.findMany({
          where: { userId: session.user.id },
          select: { takeId: true }
        })).map(vt => vt.takeId)
      : []

    // Get all takes except viewed ones
    const takes = await prisma.take.findMany({
      take: 100, // Increased limit to ensure we have enough takes after filtering
      where: {
        id: {
          notIn: viewedTakeIds
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
            verified: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                  select: {
                    members: true
                  }
                }
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          },
        },
        votes: true,
        _count: {
          select: {
            comments: true,
          }
        },
      },
    })

    // Transform and shuffle takes
    const transformedTakes = takes.map(take => ({
      ...take,
      currentUserId: session?.user?.id || null,
      userVote: take.votes.find(vote => vote.userId === session?.user?.id)?.type || null,
      community: {
        ...take.community,
        _count: {
          ...take.community._count,
          members: take.community._count?.members || 0
        },
        parent: take.community.parent ? {
          ...take.community.parent,
          _count: {
            ...take.community.parent._count,
            members: take.community.parent._count?.members || 0
          }
        } : null
      }
    }))

    // Fisher-Yates shuffle algorithm
    for (let i = transformedTakes.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [transformedTakes[i], transformedTakes[j]] = [transformedTakes[j], transformedTakes[i]];
    }

    return transformedTakes

  } catch (error) {
    console.error('Error fetching random takes:', error)
    return []
  }
}

export default async function ExplorePage() {
  const takes = await getTakes()

  return (
    <div className="container max-w-6xl py-6">
      <h1 className="text-3xl font-bold mb-8">Explore Takes</h1>
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <ExploreClient initialTakes={takes} />
      </Suspense>
    </div>
  )
} 