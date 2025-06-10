export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { transformTake } from '@/lib/utils'
import TakeClient from './take-client'

interface TakePageProps {
  params: {
    id: string
  }
}

export default async function TakePage({ params }: TakePageProps) {
  // Get the current user's session
  const session = await getServerSession(authOptions)

  const take = await prisma.take.findUnique({
    where: {
      id: params.id,
    },
    include: {
      author: true,
      community: {
        include: {
          _count: {
            select: {
              members: true,
              takes: true,
              children: true,
            },
          },
          parent: {
            include: {
              _count: {
                select: {
                  members: true,
                  takes: true,
                  children: true,
                },
              },
              parent: {
                include: {
                  _count: {
                    select: {
                      members: true,
                      takes: true,
                      children: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
      votes: true,
      comments: {
        include: {
          author: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      _count: {
        select: {
          comments: true,
          votes: true,
        },
      },
    },
  })

  if (!take) {
    notFound()
  }

  // Calculate vote counts
  const upvotes = take.votes.filter(vote => vote.type === 'UP').length
  const downvotes = take.votes.filter(vote => vote.type === 'DOWN').length

  // Transform the take with proper vote counts
  const transformedTake = {
    ...transformTake(take, session?.user?.id),
    _count: {
      ...take._count,
      upvotes,
      downvotes,
    },
  }

  return (
    <Suspense fallback={
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <TakeClient take={transformedTake} comments={take.comments} />
    </Suspense>
  )
} 