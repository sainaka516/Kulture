import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // First get the community by slug
    const community = await prisma.community.findUnique({
      where: {
        slug: params.slug,
      },
    })

    if (!community) {
      return new NextResponse('Community not found', { status: 404 })
    }

    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    })

    return NextResponse.json({ isMember: !!membership })
  } catch (error) {
    console.error('[COMMUNITY_MEMBERSHIP_GET]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 