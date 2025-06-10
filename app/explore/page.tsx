import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { transformTake } from '@/lib/utils'
import ExploreClient from './explore-client'
import { Vote } from '@prisma/client'

interface ExtendedVote extends Vote {
  createdAt: Date
  updatedAt: Date
}

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
                votes: true
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
            votes: true
          }
        },
      },
    })
    console.log('Other takes:', otherTakes.map(t => ({ id: t.id, title: t.title, authorId: t.authorId })))

    // Combine and transform takes
    const allTakes = [...friendsTakes, ...otherTakes].map(take => ({
      ...take,
      updatedAt: take.updatedAt || take.createdAt,
      communityId: take.communityId || take.community.id,
      authorId: take.authorId || take.author.id,
      currentUserId: session.user.id,
      userVote: (take.votes.find(vote => vote.userId === session.user.id)?.type || null) as "UP" | "DOWN" | null,
      votes: take.votes.map(vote => ({
        type: vote.type as 'UP' | 'DOWN',
        userId: vote.userId
      })),
      _count: {
        comments: take._count.comments,
        upvotes: take.votes.filter(v => v.type === 'UP').length,
        downvotes: take.votes.filter(v => v.type === 'DOWN').length
      },
      community: {
        ...take.community,
        _count: take.community._count || {
          takes: 0,
          children: 0,
          members: 0,
        },
        parent: take.community.parent ? {
          ...take.community.parent,
          _count: take.community.parent._count || {
            takes: 0,
            children: 0,
            members: 0,
          },
        } : null,
      }
    }))
    console.log('All takes:', allTakes.map(t => ({ id: t.id, title: t.title, authorId: t.authorId })))

    const transformedTakes = allTakes.map(take => {
      // Calculate vote counts
      const upvotes = take.votes.filter(vote => vote.type === 'UP').length
      const downvotes = take.votes.filter(vote => vote.type === 'DOWN').length

      // Type assertion for votes
      const votes = take.votes as unknown as (Vote & {
        createdAt: Date;
        updatedAt: Date;
      })[];

      return {
        ...transformTake(take, session?.user?.id),
        _count: {
          ...take._count,
          upvotes,
          downvotes,
        },
        votes: votes.map(vote => ({
          ...vote,
          createdAt: vote.createdAt.toISOString(),
          updatedAt: vote.updatedAt.toISOString(),
        })),
        community: {
          ...take.community,
          _count: take.community._count,
          parent: take.community.parent ? {
            ...take.community.parent,
            _count: take.community.parent._count,
            parent: take.community.parent.parent ? {
              ...take.community.parent.parent,
              _count: take.community.parent.parent._count,
            } : null,
          } : null,
        },
      }
    })

    return transformedTakes

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
        <ExploreClient takes={takes} />
      </Suspense>
    </div>
  )
} 