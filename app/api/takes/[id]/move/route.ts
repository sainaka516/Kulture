import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { communityId } = await request.json()
    if (!communityId) {
      return new NextResponse('Community ID is required', { status: 400 })
    }

    // Get the take and verify ownership
    const take = await prisma.take.findUnique({
      where: { id: params.id },
      select: {
        authorId: true,
        communityId: true,
      },
    })

    if (!take) {
      return new NextResponse('Take not found', { status: 404 })
    }

    // Only allow the take's author to move it
    if (take.authorId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify the target community exists
    const targetCommunity = await prisma.community.findUnique({
      where: { id: communityId },
    })

    if (!targetCommunity) {
      return new NextResponse('Target community not found', { status: 404 })
    }

    // Move the take to the new community
    const updatedTake = await prisma.take.update({
      where: { id: params.id },
      data: { communityId },
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

    // Transform the take to include vote counts and current user info
    const transformedTake = {
      ...updatedTake,
      currentUserId: session.user.id,
      userVote: updatedTake.votes.find(vote => vote.userId === session.user.id)?.type || null,
      _count: {
        ...updatedTake._count,
        upvotes: updatedTake.votes.filter(vote => vote.type === 'UP').length,
        downvotes: updatedTake.votes.filter(vote => vote.type === 'DOWN').length
      }
    }

    return NextResponse.json(transformedTake)
  } catch (error) {
    console.error('[TAKE_MOVE]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 