import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import UserProfile from './user-profile'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { transformTake } from '@/lib/utils'

interface PageProps {
  params: {
    userId: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      name: true,
      username: true,
    },
  })

  if (!user) {
    return {
      title: 'User Not Found',
    }
  }

  return {
    title: `${user.name || user.username} | Reddit Clone`,
  }
}

export default async function UserPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      takes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              verified: true,
              image: true
            }
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
                      members: true,
                      takes: true,
                      children: true
                    }
                  }
                }
              },
              _count: {
                select: {
                  members: true,
                  takes: true,
                  children: true
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
      },
      _count: {
        select: {
          takes: true,
          comments: true,
          communities: true,
          friends: true
        }
      },
      friends: {
        select: {
          friendId: true
        }
      },
      receivedFriendRequests: {
        where: {
          status: 'PENDING'
        },
        select: {
          senderId: true,
          status: true
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  // Transform takes with proper vote counts
  const transformedTakes = user.takes.map(take => {
    // Calculate vote counts
    const upvotes = take.votes.filter(vote => vote.type === 'UP').length
    const downvotes = take.votes.filter(vote => vote.type === 'DOWN').length

    return {
      ...transformTake(take, session?.user?.id),
      _count: {
        ...take._count,
        upvotes,
        downvotes,
      },
      community: {
        id: take.community.id,
        name: take.community.name,
        slug: take.community.slug,
        parent: take.community.parent ? {
          id: take.community.parent.id,
          name: take.community.parent.name,
          slug: take.community.parent.slug,
          _count: {
            members: take.community.parent._count?.members || 0,
            takes: take.community.parent._count?.takes || 0,
            children: take.community.parent._count?.children || 0,
          }
        } : null,
        _count: {
          members: take.community._count?.members || 0,
          takes: take.community._count?.takes || 0,
          children: take.community._count?.children || 0,
        }
      }
    }
  })

  const showEmail = session?.user?.id === user.id

  return (
    <div className="container">
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <UserProfile
          currentUser={{
            id: user.id,
            name: user.name,
            username: user.username,
            image: user.image,
            verified: user.verified,
            takes: transformedTakes
          }}
          session={session}
          showEmail={showEmail}
        />
      </Suspense>
    </div>
  )
} 