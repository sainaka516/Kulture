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

    // Delete the community membership
    await db.communityMember.delete({
      where: {
        userId_communityId: {
          userId: session.user.id,
          communityId: community.id,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[COMMUNITY_LEAVE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 