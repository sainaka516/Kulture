import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const communityId = searchParams.get('communityId')
    const userId = searchParams.get('userId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // Get viewed takes for the current user
    const viewedTakeIds = session?.user?.id
      ? (await prisma.viewedTake.findMany({
          where: { userId: session.user.id },
          select: { takeId: true }
        })).map(vt => vt.takeId)
      : []

    const where = {
      ...(communityId && { communityId }),
      ...(userId && { authorId: userId }),
      // Exclude viewed takes
      ...(viewedTakeIds.length > 0 && {
        id: {
          notIn: viewedTakeIds
        }
      })
    }

    const takes = await prisma.take.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
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
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                parent: {
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
                  }
                },
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
            comments: true,
            votes: {
              where: { type: 'UP' }
            },
            downvotes: {
              where: { type: 'DOWN' }
            }
          },
        },
      },
    })

    // Transform the takes to include userVote
    const transformedTakes = takes.map(take => {
      const userVote = session?.user?.id
        ? take.votes.find(vote => vote.userId === session.user.id)?.type
        : null

      return {
        ...take,
        userVote,
        _count: {
          ...take._count,
          upvotes: take.votes.filter(v => v.type === 'UP').length,
          downvotes: take.votes.filter(v => v.type === 'DOWN').length,
        }
      }
    })

    // Get total count for pagination
    const total = await prisma.take.count({ where })

    return NextResponse.json({
      takes: transformedTakes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + takes.length < total
    })
  } catch (error) {
    console.error('Failed to fetch takes:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const json = await request.json()
    const { title, content, communityId } = json

    if (!title || !communityId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const take = await prisma.take.create({
      data: {
        title,
        content,
        authorId: session.user.id,
        communityId,
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
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                parent: {
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
                  }
                },
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
            comments: true,
          },
        },
      },
    })

    return NextResponse.json(take)
  } catch (error) {
    console.error('Failed to create take:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 