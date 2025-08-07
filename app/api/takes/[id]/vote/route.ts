import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

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
    const take = await db.take.findUnique({
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
        await db.vote.delete({
          where: {
            id: existingVote.id
          }
        })
      } else {
        // Update vote if different type
        await db.vote.update({
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
      await db.vote.create({
        data: {
          type,
          userId: session.user.id,
          takeId: params.id
        }
      })
    }

    // Get updated take with all votes and community data
    const updatedTake = await db.take.findUnique({
      where: {
        id: params.id,
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
          include: {
            _count: {
              select: {
                members: true,
                takes: true,
                children: true
              }
            },
            parent: {
              include: {
                _count: {
                  select: {
                    members: true,
                    takes: true,
                    children: true
                  }
                },
                parent: {
                  include: {
                    _count: {
                      select: {
                        members: true,
                        takes: true,
                        children: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        votes: true,
        _count: {
          select: {
            comments: true,
            votes: true
          }
        }
      },
    })

    if (!updatedTake) {
      return new NextResponse('Take not found after update', { status: 404 })
    }

    // Calculate vote counts
    const upvotes = updatedTake.votes.filter(v => v.type === 'UP').length
    const downvotes = updatedTake.votes.filter(v => v.type === 'DOWN').length

    // Get user's current vote
    const userVote = updatedTake.votes.find(v => v.userId === session.user.id)?.type || null

    // Transform the data
    const transformedTake = {
      ...updatedTake,
      currentUserId: session.user.id,
      userVote,
      _count: {
        ...updatedTake._count,
        upvotes,
        downvotes,
      },
      votes: updatedTake.votes.map(vote => ({
        id: vote.id,
        type: vote.type,
        userId: vote.userId,
        takeId: vote.takeId,
        createdAt: vote.createdAt,
        updatedAt: vote.updatedAt
      }))
    }

    return NextResponse.json(transformedTake)
  } catch (error) {
    console.error('[TAKE_VOTE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 