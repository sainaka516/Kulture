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

    console.log('Processing vote:', {
      takeId: params.id,
      userId: session.user.id,
      voteType: type
    })

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
      console.log('Take not found:', params.id)
      return new NextResponse('Take not found', { status: 404 })
    }

    console.log('Found take:', {
      takeId: take.id,
      existingVotes: take.votes
    })

    // Check if user has already voted
    const existingVote = take.votes[0]

    if (existingVote) {
      console.log('Found existing vote:', {
        voteId: existingVote.id,
        existingType: existingVote.type,
        newType: type
      })

      if (existingVote.type === type) {
        // Remove vote if same type
        console.log('Removing vote:', existingVote.id)
        await prisma.vote.delete({
          where: {
            id: existingVote.id
          }
        })
      } else {
        // Update vote if different type
        console.log('Updating vote:', {
          voteId: existingVote.id,
          oldType: existingVote.type,
          newType: type
        })
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
      console.log('Creating new vote:', {
        userId: session.user.id,
        takeId: params.id,
        type
      })
      await prisma.vote.create({
        data: {
          type,
          userId: session.user.id,
          takeId: params.id
        }
      })
    }

    // Get updated take with all necessary data
    const updatedTake = await prisma.take.findUnique({
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
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                _count: {
                  select: {
                    members: true
                  }
                }
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          },
        },
        votes: true,
        _count: {
          select: {
            comments: true
          }
        },
      },
    })

    // Transform the take to include proper member counts and vote counts
    const transformedTake = {
      ...updatedTake,
      community: {
        ...updatedTake.community,
        _count: {
          ...updatedTake.community._count,
          members: updatedTake.community._count?.members || 0
        },
        parent: updatedTake.community.parent ? {
          ...updatedTake.community.parent,
          _count: {
            ...updatedTake.community.parent._count,
            members: updatedTake.community.parent._count?.members || 0
          }
        } : null
      },
      _count: {
        ...updatedTake._count,
        votes: updatedTake.votes.length,
      },
      userVote: updatedTake.votes.find(vote => vote.userId === session.user.id)?.type || null
    }

    console.log('Updated take:', {
      takeId: transformedTake.id,
      totalVotes: transformedTake.votes.length,
      upvotes: transformedTake.votes.filter(v => v.type === 'UP').length,
      downvotes: transformedTake.votes.filter(v => v.type === 'DOWN').length,
      memberCount: transformedTake.community._count?.members,
      parentMemberCount: transformedTake.community.parent?._count?.members
    })

    return NextResponse.json(transformedTake)
  } catch (error) {
    console.error('[TAKE_VOTE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 