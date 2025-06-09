import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import ExploreClient from './explore-client'

// Make sure data is always fresh
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

async function getTakes() {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', { userId: session?.user?.id })

    if (!session?.user?.id) {
      console.log('No user session')
      return []
    }

    // Get viewed takes for the current user
    const viewedTakeIds = (await prisma.viewedTake.findMany({
      where: { userId: session.user.id },
      select: { takeId: true }
    })).map(vt => vt.takeId)
    console.log('Viewed take IDs:', viewedTakeIds)

    // Get friends' IDs
    const friendIds = (await prisma.friendship.findMany({
      where: { userId: session.user.id },
      select: { friendId: true }
    })).map(f => f.friendId)
    console.log('Friend IDs:', friendIds)

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
    console.log('Friends takes:', friendsTakes.map(t => ({ id: t.id, title: t.title, authorId: t.authorId })))

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
    console.log('Other takes:', otherTakes.map(t => ({ id: t.id, title: t.title, authorId: t.authorId })))

    // Combine and transform takes
    const allTakes = [...friendsTakes, ...otherTakes].map(take => ({
      ...take,
      createdAt: take.createdAt.toISOString(),
      currentUserId: session.user.id,
      userVote: take.votes.find(vote => vote.userId === session.user.id)?.type || null,
      votes: take.votes.map(vote => ({
        type: vote.type as 'UP' | 'DOWN',
        userId: vote.userId
      })),
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
    console.log('All takes:', allTakes.map(t => ({ id: t.id, title: t.title, authorId: t.authorId })))

    return allTakes

  } catch (error) {
    console.error('Error fetching takes:', error)
    return []
  }
}

export default async function ExplorePage() {
  const takes = await getTakes()

  return (
    <div className="container max-w-6xl py-6">
      <h1 className="text-3xl font-bold mb-8">Explore Takes</h1>
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <ExploreClient initialTakes={takes} />
      </Suspense>
    </div>
  )
} 