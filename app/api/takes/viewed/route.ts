import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Mark a take as viewed
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { takeId } = await request.json()
    if (!takeId) {
      return new NextResponse('Take ID is required', { status: 400 })
    }

    const viewedTake = await prisma.viewedTake.create({
      data: {
        userId: session.user.id,
        takeId,
      },
    })

    return NextResponse.json(viewedTake)
  } catch (error) {
    if ((error as any).code === 'P2002') {
      // Unique constraint violation - take already viewed
      return NextResponse.json({ message: 'Take already viewed' }, { status: 200 })
    }
    console.error('Error marking take as viewed:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Get viewed takes
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const viewedTakes = await prisma.viewedTake.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        take: {
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
              }
            },
            votes: true,
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
      skip,
      take: limit,
    })

    const total = await prisma.viewedTake.count({
      where: {
        userId: session.user.id,
      },
    })

    return NextResponse.json({
      takes: viewedTakes.map(vt => ({
        ...vt.take,
        _count: {
          ...vt.take._count,
          upvotes: vt.take.votes.filter(v => v.type === 'UP').length,
          downvotes: vt.take.votes.filter(v => v.type === 'DOWN').length,
        }
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error('Error getting viewed takes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 