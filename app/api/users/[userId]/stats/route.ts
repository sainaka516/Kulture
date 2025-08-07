import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
      db.take.count({
        where: { authorId: userId }
      }),
      db.comment.count({
        where: { authorId: userId }
      }),
      db.communityMember.findMany({
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
      db.user.findUnique({
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