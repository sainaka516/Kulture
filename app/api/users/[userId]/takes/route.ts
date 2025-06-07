import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Only allow users to fetch their own takes
  if (session.user.id !== params.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const takes = await prisma.take.findMany({
      where: {
        authorId: params.userId,
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
          select: {
            id: true,
            name: true,
            slug: true,
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(takes)
  } catch (error) {
    console.error('Error fetching takes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 