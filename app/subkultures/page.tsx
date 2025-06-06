import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import SubkultureList from '@/components/SubkultureList'

export const metadata: Metadata = {
  title: 'Subkultures - Kulture',
  description: 'Browse and join communities on Kulture',
}

export default async function SubkulturesPage() {
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

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Subkultures</h1>
          <p className="text-muted-foreground mt-1">
            Browse all available subkultures
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SubkultureList communities={communities} />
      </Suspense>
    </div>
  )
} 