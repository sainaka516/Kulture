import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Get viewed takes for the current user
    const viewedTakeIds = (await prisma.viewedTake.findMany({
      where: { userId: session.user.id },
      select: { takeId: true }
    })).map(vt => vt.takeId)

    // Get friends' IDs
    const friendIds = (await prisma.friendship.findMany({
      where: { userId: session.user.id },
      select: { friendId: true }
    })).map(f => f.friendId)

    // Get friends' takes first if user has friends
    const friendsTakes = friendIds.length > 0
      ? await prisma.take.findMany({
          where: {
            id: { notIn: viewedTakeIds },
            authorId: { in: friendIds }
          },
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
                username: true,
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
              }
            },
          },
        })
      : []

    // Get takes from other users
    const otherTakes = await prisma.take.findMany({
      where: {
        id: { notIn: viewedTakeIds },
        authorId: { notIn: [...friendIds, session.user.id] }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
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
          }
        },
      },
    })

    // Combine and transform takes
    const allTakes = [...friendsTakes, ...otherTakes].map(take => ({
      ...take,
      currentUserId: session.user.id,
      userVote: take.votes.find(vote => vote.userId === session.user.id)?.type || null,
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

    return NextResponse.json({
      takes: allTakes,
      hasMore: allTakes.length >= 10
    })
  } catch (error) {
    console.error('Error refreshing takes:', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 