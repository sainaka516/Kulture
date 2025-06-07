import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import TakeFeed from '@/components/TakeFeed'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import CommunityCard from '@/components/CommunityCard'

interface PageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      name: true,
    },
  })

  if (!user) return {}

  return {
    title: `${user.name}'s Profile - Kulture`,
    description: `View ${user.name}'s takes and activity on Kulture`,
  }
}

function TakeFeedSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center space-x-4">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-1/4 bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default async function UserProfilePage({ params }: PageProps) {
  const user = await prisma.user.findUnique({
    where: {
      id: params.id,
    },
    include: {
      takes: {
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
            },
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
      },
      communities: {
        include: {
          community: {
            include: {
              parent: {
                select: {
                  name: true,
                  slug: true,
                },
              },
              _count: {
                select: {
                  takes: true,
                  members: true,
                  children: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          takes: true,
          comments: true,
          communities: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  return (
    <div className="container py-8">
      <div className="grid grid-cols-1 gap-y-8 md:grid-cols-3 md:gap-x-8">
        <div className="col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">{user.name}'s Takes</h1>
          </div>

          <Suspense fallback={<TakeFeedSkeleton />}>
            <TakeFeed initialTakes={user.takes} />
          </Suspense>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border p-6">
            <h2 className="font-semibold">About {user.name}</h2>
            <dl className="mt-4 space-y-4">
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Takes</dt>
                <dd className="text-sm font-medium">{user._count.takes}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Comments</dt>
                <dd className="text-sm font-medium">{user._count.comments}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Communities</dt>
                <dd className="text-sm font-medium">
                  {user._count.communities}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-muted-foreground">Joined</dt>
                <dd className="text-sm font-medium">
                  {format(new Date(user.createdAt), 'MMM d, yyyy')}
                </dd>
              </div>
            </dl>
          </div>

          {user.communities.length > 0 && (
            <div className="rounded-lg border p-6">
              <h2 className="font-semibold">Communities</h2>
              <div className="mt-4 space-y-4">
                {user.communities.map(({ community }) => (
                  <CommunityCard key={community.id} community={community} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 