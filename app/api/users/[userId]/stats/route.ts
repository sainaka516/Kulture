import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const userId = params.userId

    // Verify the user is requesting their own stats
    if (session.user.id !== userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get user stats
    const [takes, comments, communities, user] = await Promise.all([
      prisma.take.count({
        where: { authorId: userId }
      }),
      prisma.comment.count({
        where: { authorId: userId }
      }),
      prisma.communityMember.findMany({
        where: { userId },
        include: {
          community: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { createdAt: true }
      })
    ])

    return NextResponse.json({
      totalTakes: takes,
      totalComments: comments,
      totalCommunities: communities.length,
      joinedCommunities: communities.map(member => member.community),
      createdAt: user?.createdAt
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 