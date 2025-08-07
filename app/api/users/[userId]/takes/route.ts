import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Only allow users to fetch their own takes
  if (session.user.id !== params.userId) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const takes = await db.take.findMany({
      where: {
        authorId: params.userId,
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
                members: true
              }
            },
            parent: {
              include: {
                _count: {
                  select: {
                    members: true
                  }
                },
                parent: {
                  include: {
                    _count: {
                      select: {
                        members: true
                      }
                    },
                    parent: {
                      include: {
                        _count: {
                          select: {
                            members: true
                          }
                        }
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
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform takes to include vote counts
    const transformedTakes = takes.map(take => ({
      ...take,
      _count: {
        ...take._count,
        upvotes: take.votes.filter(vote => vote.type === 'UP').length,
        downvotes: take.votes.filter(vote => vote.type === 'DOWN').length,
      }
    }))

    return NextResponse.json(transformedTakes)
  } catch (error) {
    console.error('Error fetching takes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 