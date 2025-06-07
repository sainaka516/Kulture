import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { Loader2, Plus } from 'lucide-react'
import prisma from '@/lib/prisma'
import KultureList from '@/components/KultureList'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Kultures - Kulture',
  description: 'Browse and discover communities on Kulture',
}

export default async function KulturesPage() {
  // First get all parent communities with their member counts
  const communities = await prisma.community.findMany({
    where: {
      parentId: null,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      members: true,
      takes: true,
      children: true,
      _count: {
        select: {
          members: true,
          takes: true,
          children: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Sort communities by member count manually
  const sortedCommunities = communities.sort((a, b) => {
    // First sort by member count
    const memberDiff = b._count.members - a._count.members
    if (memberDiff !== 0) return memberDiff
    // If member counts are equal, sort by name
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="container max-w-6xl py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Kultures</h1>
          <p className="text-muted-foreground mt-2">
            Browse and join communities that interest you
          </p>
        </div>
        <Link href="/create-kulture">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Kulture
          </Button>
        </Link>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <KultureList communities={sortedCommunities} />
      </Suspense>
    </div>
  )
} 