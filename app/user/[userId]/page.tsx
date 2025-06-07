import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import UserProfile from './user-profile'

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
              image: true,
              username: true,
              verified: true
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
              votes: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
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

  const showEmail = session?.user?.id === user.id

  return <UserProfile user={user} session={session} showEmail={showEmail} />
} 