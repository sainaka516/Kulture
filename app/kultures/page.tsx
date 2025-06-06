import { Metadata } from 'next'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import prisma from '@/lib/prisma'
import KultureList from '@/components/KultureList'

export const metadata: Metadata = {
  title: 'Kultures - Kulture',
  description: 'Browse and discover communities on Kulture',
}

export default async function KulturesPage() {
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
          <h1 className="text-2xl font-bold">Kultures</h1>
          <p className="text-muted-foreground mt-1">
            Browse all available kultures
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
        <KultureList communities={communities} />
      </Suspense>
    </div>
  )
} 