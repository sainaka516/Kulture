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

    // Get updated take with all votes and community data
    const [updatedTake, commentsCount] = await Promise.all([
      prisma.take.findUnique({
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
              members: true,
              parent: {
                include: {
                  members: true,
                  parent: {
                    include: {
                      members: true,
                      parent: {
                        include: {
                          members: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          votes: true,
        },
      }),
      prisma.comment.count({
        where: {
          takeId: params.id
        }
      })
    ])

    if (!updatedTake) {
      return new NextResponse('Take not found after update', { status: 404 })
    }

    // Transform the data to include member counts
    const transformedTake = {
      ...updatedTake,
      currentUserId: session.user.id,
      userVote: updatedTake.votes.find(v => v.userId === session.user.id)?.type || null,
      community: {
        ...updatedTake.community,
        _count: {
          members: updatedTake.community.members.length
        },
        parent: updatedTake.community.parent ? {
          ...updatedTake.community.parent,
          _count: {
            members: updatedTake.community.parent.members.length
          },
          parent: updatedTake.community.parent.parent ? {
            ...updatedTake.community.parent.parent,
            _count: {
              members: updatedTake.community.parent.parent.members.length
            },
            parent: updatedTake.community.parent.parent.parent ? {
              ...updatedTake.community.parent.parent.parent,
              _count: {
                members: updatedTake.community.parent.parent.parent.members.length
              }
            } : null
          } : null
        } : null
      },
      _count: {
        comments: commentsCount,
        upvotes: updatedTake.votes.filter(v => v.type === 'UP').length,
        downvotes: updatedTake.votes.filter(v => v.type === 'DOWN').length,
      }
    }

    // Remove the members arrays from the response to keep it clean
    delete transformedTake.community.members
    if (transformedTake.community.parent) {
      delete transformedTake.community.parent.members
      if (transformedTake.community.parent.parent) {
        delete transformedTake.community.parent.parent.members
        if (transformedTake.community.parent.parent.parent) {
          delete transformedTake.community.parent.parent.parent.members
        }
      }
    }

    return NextResponse.json(transformedTake)
  } catch (error) {
    console.error('[TAKE_VOTE_POST]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 