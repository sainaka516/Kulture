import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const takes = await prisma.take.findMany({
      where: {
        authorId: params.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            verified: true,
          },
        },
        community: {
          include: {
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
        votes: true,
        _count: {
          select: {
            comments: true,
          },
        },
      },
    })

    // Transform takes to include vote counts
    const transformedTakes = takes.map(take => ({
      ...take,
      _count: {
        ...take._count,
        upvotes: take.votes.filter(vote => vote.type === 'UP').length,
        downvotes: take.votes.filter(vote => vote.type === 'DOWN').length,
      }
    }))

    return NextResponse.json(transformedTakes)
  } catch (error) {
    console.error('[USER_TAKES]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 