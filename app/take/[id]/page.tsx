import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import TakeCard from '@/components/TakeCard'
import Comments from '@/components/Comments'
import prisma from '@/lib/prisma'
import CommunityCard from '@/components/CommunityCard'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              members: true,
              takes: true,
              children: true,
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
        },
      },
    },
  })

  if (!take) {
    notFound()
  }

  // Transform take to include currentUserId and userVote
  const transformedTake = {
    ...take,
    currentUserId: session?.user?.id,
    userVote: session?.user?.id 
      ? take.votes.find(vote => vote.userId === session.user.id)?.type || null
      : null,
    _count: {
      ...take._count,
      upvotes: take.votes.filter(vote => vote.type === 'UP').length,
      downvotes: take.votes.filter(vote => vote.type === 'DOWN').length
    }
  }

  return (
    <div className="container flex flex-col items-center justify-between gap-6 py-8 md:flex-row md:items-start">
      <div className="w-full md:w-3/4">
        <TakeCard take={transformedTake} currentKultureSlug={null} />
        <div className="mt-6">
          <Comments takeId={take.id} initialComments={take.comments} />
        </div>
      </div>
      <div className="w-full md:w-1/4">
        <CommunityCard community={take.community} />
      </div>
    </div>
  )
} 