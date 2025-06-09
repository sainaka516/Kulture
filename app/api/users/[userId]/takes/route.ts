import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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
    const takes = await prisma.take.findMany({
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
            parent: {
              include: {
                parent: {
                  include: {
                    parent: true,
                    _count: {
                      select: {
                        members: true
                      }
                    }
                  },
                  _count: {
                    select: {
                      members: true
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Transform takes to include proper counts and parent chain
    const transformedTakes = takes.map(take => ({
      ...take,
      community: {
        ...take.community,
        _count: {
          ...take.community._count,
          members: take.community._count?.members || 0
        },
        parent: take.community.parent ? {
          ...take.community.parent,
          parent: take.community.parent.parent ? {
            ...take.community.parent.parent,
            parent: take.community.parent.parent.parent ? {
              ...take.community.parent.parent.parent,
              _count: {
                ...take.community.parent.parent.parent._count,
                members: take.community.parent.parent.parent._count?.members || 0
              }
            } : null,
            _count: {
              ...take.community.parent.parent._count,
              members: take.community.parent.parent._count?.members || 0
            }
          } : null,
          _count: {
            ...take.community.parent._count,
            members: take.community.parent._count?.members || 0
          }
        } : null
      }
    }))

    return NextResponse.json(transformedTakes)
  } catch (error) {
    console.error('Error fetching takes:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 