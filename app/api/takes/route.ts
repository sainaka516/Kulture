import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const userId = searchParams.get('userId')

    const where = {
      ...(communityId && { communityId }),
      ...(userId && { authorId: userId }),
    }

    const takes = await prisma.take.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
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

    return NextResponse.json(takes)
  } catch (error) {
    console.error('Failed to fetch takes:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await request.json()
    const { title, content, communityId } = json

    if (!title || !communityId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const take = await prisma.take.create({
      data: {
        title,
        content,
        authorId: session.user.id,
        communityId,
      },
      include: {
        community: {
          select: {
            slug: true,
          },
        },
      },
    })

    return NextResponse.json(take)
  } catch (error) {
    console.error('Failed to create take:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 