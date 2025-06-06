import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const take = await prisma.take.findUnique({
      where: {
        id: params.id,
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
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!take) {
      return new NextResponse('Take not found', { status: 404 })
    }

    return NextResponse.json(take)
  } catch (error) {
    console.error('Failed to fetch take:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const take = await prisma.take.findUnique({
      where: {
        id: params.id,
      },
      select: {
        authorId: true,
      },
    })

    if (!take) {
      return new NextResponse('Take not found', { status: 404 })
    }

    if (take.authorId !== session.user.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await prisma.take.delete({
      where: {
        id: params.id,
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete take:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 