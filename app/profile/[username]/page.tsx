import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { transformTake } from '@/lib/utils'
import ProfileClient from './profile-client'

interface ProfilePageProps {
  params: {
    username: string
  }
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const user = await db.user.findUnique({
    where: {
      username: params.username,
    },
    select: {
      name: true,
      username: true,
    },
  })

  if (!user) {
    return {
      title: 'User Not Found - Kulture',
    }
  }

  return {
    title: `${user.name || user.username} (@${user.username}) - Kulture`,
    description: `View ${user.name || user.username}'s profile on Kulture`,
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await getServerSession(authOptions)
  const user = await db.user.findUnique({
    where: { username: params.username },
    include: {
      takes: {
        select: {
          id: true,
          title: true,
          content: true,
          createdAt: true,
          updatedAt: true,
          authorId: true,
          communityId: true,
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
                  members: true,
                  takes: true,
                  children: true
                }
              },
              parent: {
                include: {
                  _count: {
                    select: {
                      members: true,
                      takes: true,
                      children: true
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
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 20
      },
      communities: {
        select: {
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              _count: {
                select: {
                  members: true,
                  takes: true,
                  children: true
                }
              }
            }
          }
        }
      },
      votes: {
        include: {
          take: {
            select: {
              id: true,
              title: true,
              community: {
                select: {
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      },
      comments: {
        include: {
          take: {
            select: {
              id: true,
              title: true,
              community: {
                select: {
                  name: true,
                  slug: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      },
      friends: {
        include: {
          friend: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          }
        }
      },
      friendsOf: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          }
        }
      },
      ownedCommunities: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: {
            select: {
              members: true,
              takes: true,
              children: true
            }
          }
        }
      },
      _count: {
        select: {
          takes: true,
          comments: true,
          votes: true,
          friends: true,
          friendsOf: true,
          ownedCommunities: true
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  // Transform user data to include upvotes and downvotes counts
  const userData = {
    id: user.id,
    name: user.name,
    username: user.username,
    image: user.image,
    verified: user.verified,
    takes: user.takes.map(take => transformTake(take, session?.user?.id)),
    joinedKultures: user.communities.map(c => ({
      id: c.community.id,
      name: c.community.name,
      slug: c.community.slug,
      description: c.community.description,
      _count: c.community._count
    })),
    ownedKultures: user.ownedCommunities.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      _count: c._count
    })),
    recentVotes: user.votes.map(vote => ({
      id: vote.id,
      type: vote.type,
      createdAt: vote.createdAt.toISOString(),
      take: vote.take
    })),
    recentComments: user.comments
      .filter(comment => comment.take !== null)
      .map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        take: comment.take!
      })),
    friends: [...user.friends.map(f => f.friend), ...user.friendsOf.map(f => f.user)],
    _count: {
      takes: user._count.takes,
      comments: user._count.comments,
      upvotes: user.votes.filter(v => v.type === 'UP').length,
      downvotes: user.votes.filter(v => v.type === 'DOWN').length,
      friends: user._count.friends + user._count.friendsOf,
      ownedKultures: user._count.ownedCommunities
    },
    createdAt: user.createdAt.toISOString()
  }

  return (
    <Suspense fallback={
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <ProfileClient user={userData} />
    </Suspense>
  )
} 