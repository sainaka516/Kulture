import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // First get the community by slug
    const community = await db.community.findUnique({
      where: {
        slug: params.slug,
      },
    })

    if (!community) {
      return new NextResponse('Community not found', { status: 404 })
    }

    // Check if already a member
    const existingMembership = await db.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    })

    if (existingMembership) {
      return new NextResponse('Already a member', { status: 400 })
    }

    // Create the community membership
    await db.communityMember.create({
      data: {
        userId: session.user.id,
        communityId: community.id,
        role: 'MEMBER',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[COMMUNITY_JOIN_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 