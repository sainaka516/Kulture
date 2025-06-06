import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    // First get the community by slug
    const community = await prisma.community.findUnique({
      where: {
        slug: params.slug,
      },
    })

    if (!community) {
      return new NextResponse('Community not found', { status: 404 })
    }

    const takes = await prisma.take.findMany({
      where: {
        communityId: community.id,
      },
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
    console.error('[COMMUNITY_TAKES_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 