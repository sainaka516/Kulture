import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { type } = body

    if (!type || !['UP', 'DOWN'].includes(type)) {
      return new NextResponse('Invalid vote type', { status: 400 })
    }

    // Check if take exists
    const take = await prisma.take.findUnique({
      where: { id: params.id },
      include: {
        votes: {
          where: {
            userId: session.user.id
          }
        }
      }
    })

    if (!take) {
      return new NextResponse('Take not found', { status: 404 })
    }

    // Check if user has already voted
    const existingVote = take.votes[0]

    if (existingVote) {
      if (existingVote.type === type) {
        // Remove vote if same type
        await prisma.vote.delete({
          where: {
            id: existingVote.id
          }
        })
      } else {
        // Update vote if different type
        await prisma.vote.update({
          where: {
            id: existingVote.id
          },
          data: {
            type
          }
        })
      }
    } else {
      // Create new vote
      await prisma.vote.create({
        data: {
          type,
          userId: session.user.id,
          takeId: params.id
        }
      })
    }

    // Get updated take with all votes
    const updatedTake = await prisma.take.findUnique({
      where: {
        id: params.id,
      },
      include: {
        votes: true,
      },
    })

    if (!updatedTake) {
      return new NextResponse('Take not found after update', { status: 404 })
    }

    // Transform the response to match the expected format
    const response = {
      id: updatedTake.id,
      votes: updatedTake.votes,
      _count: {
        upvotes: updatedTake.votes.filter(v => v.type === 'UP').length,
        downvotes: updatedTake.votes.filter(v => v.type === 'DOWN').length,
      },
      userVote: updatedTake.votes.find(v => v.userId === session.user.id)?.type || null
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('[TAKE_VOTE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 