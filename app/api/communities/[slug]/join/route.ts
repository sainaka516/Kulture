import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  req: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const community = await prisma.community.findUnique({
      where: { slug: params.slug },
      include: {
        members: {
          where: {
            userId: session.user.id,
          },
        },
      },
    })

    if (!community) {
      return new NextResponse('Community not found', { status: 404 })
    }

    // If user is already a member, remove them (unsubscribe)
    if (community.members.length > 0) {
      await prisma.communityMember.delete({
        where: {
          userId_communityId: {
            userId: session.user.id,
            communityId: community.id,
          },
        },
      })
      return new NextResponse('Successfully left the community')
    }

    // If user is not a member, add them (subscribe)
    await prisma.communityMember.create({
      data: {
        userId: session.user.id,
        communityId: community.id,
      },
    })

    return new NextResponse('Successfully joined the community')
  } catch (error) {
    console.error('[COMMUNITY_JOIN]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 