export const dynamic = 'force-dynamic'

'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2, Mail, Calendar, MessageSquare, Share2, Users } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import TakeFeed from '@/components/TakeFeed'
import { Take } from '@/lib/types'
import { TakesProvider } from '@/lib/contexts/TakesContext'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { transformTake } from '@/lib/utils'

interface UserStats {
  totalTakes: number
  totalComments: number
  totalCommunities: number
  createdAt: string
  joinedCommunities: Array<{
    id: string
    name: string
    slug: string
  }>
}

export default async function ProfilePage() {
  // Get the current user's session
  const session = await getServerSession(authOptions)

  if (!session) {
    notFound()
  }

  // Fetch user's takes
  const takes = await prisma.take.findMany({
    where: {
      authorId: session.user.id,
    },
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
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Transform takes with proper vote counts
  const transformedTakes = takes.map(take => {
    // Calculate vote counts
    const upvotes = take.votes.filter(vote => vote.type === 'UP').length
    const downvotes = take.votes.filter(vote => vote.type === 'DOWN').length

    return {
      ...transformTake(take, session.user.id),
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

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">Your Takes</h1>
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }>
        <TakesProvider initialTakes={transformedTakes}>
          <TakeFeed
            takes={transformedTakes}
            currentKultureSlug={null}
          />
        </TakesProvider>
      </Suspense>
    </div>
  )
} 