import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import prisma from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import CommunityClient from './community-client'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

interface CommunityPageProps {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: CommunityPageProps): Promise<Metadata> {
  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      description: true,
    },
  })

  if (!community) return {}

  return {
    title: `k/${community.name} - Kulture`,
    description: community.description || `Welcome to k/${community.name} on Kulture`,
  }
}

export default async function CommunityPage({ params }: CommunityPageProps) {
  const community = await prisma.community.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      parent: {
        select: {
          name: true,
          slug: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          _count: {
            select: {
              members: true,
              takes: true,
              children: true,
            },
          },
        },
      },
      takes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
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
      _count: {
        select: {
          members: true,
          takes: true,
          children: true,
        },
      },
    },
  })

  if (!community) {
    notFound()
  }

  return (
    <div className="container max-w-4xl py-6">
      <Suspense
        fallback={
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <CommunityClient community={community} />
      </Suspense>
    </div>
  )
} 