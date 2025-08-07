import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(request.url)
    const cursor = searchParams.get('cursor')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get takes that the user hasn't viewed yet
    const takes = await db.take.findMany({
      where: {
        NOT: {
          viewedBy: {
            some: {
              userId: session?.user?.id
            }
          }
        }
      },
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            verified: true
          }
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
            comments: true
          }
        }
      }
    })

    // Transform takes to include currentUserId and userVote
    const transformedTakes = takes.map(take => ({
      ...take,
      currentUserId: session?.user?.id,
      userVote: session?.user?.id 
        ? take.votes.find(vote => vote.userId === session.user.id)?.type || null
        : null,
      _count: {
        ...take._count,
        upvotes: take.votes.filter(vote => vote.type === 'UP').length,
        downvotes: take.votes.filter(vote => vote.type === 'DOWN').length
      }
    }))

    return NextResponse.json(transformedTakes)
  } catch (error) {
    console.error('[TAKES_GET]', error)
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

    if (!title || !content || !communityId) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const take = await db.take.create({
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
    })

    return NextResponse.json(take)
  } catch (error) {
    console.error('Failed to create take:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 