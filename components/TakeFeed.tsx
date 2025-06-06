'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Loader2, Flame, Clock, TrendingUp } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import TakeCard from '@/components/TakeCard'

interface Take {
  id: string
  title: string
  content: string | null
  createdAt: Date
  author: {
    id: string
    name: string | null
    image: string | null
  }
  community: {
    id: string
    name: string
    slug: string
    parent?: {
      id: string
      name: string
      slug: string
    } | null
  }
  votes: {
    type: 'UP' | 'DOWN'
    userId: string
  }[]
  _count?: {
    comments: number
  }
}

interface TakeFeedProps {
  initialTakes: Take[]
  communityId?: string
  communitySlug?: string
}

export default function TakeFeed({ initialTakes, communityId, communitySlug }: TakeFeedProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [takes, setTakes] = useState<Take[]>(initialTakes)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sort = searchParams.get('sort') || 'hot'

  const fetchTakes = useCallback(() => {
    setIsLoading(true)
    fetch(
      communitySlug
        ? `/api/k/${communitySlug}/takes`
        : `/api/takes`
    )
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch takes')
        }
        return response.json()
      })
      .then((data) => {
        setTakes(data)
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: 'Failed to fetch takes. Please try again.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [communitySlug, toast])

  useEffect(() => {
    if (communitySlug) {
      fetchTakes()
    }
  }, [communitySlug, fetchTakes])

  useEffect(() => {
    fetchTakes()
  }, [session, fetchTakes])

  const handleSortChange = (newSort: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('sort', newSort)
    router.push(`?${params.toString()}`)
    fetchTakes()
  }

  // Group takes by community
  const groupedTakes = takes.reduce((acc, take) => {
    const communityId = take.community.id
    if (!acc[communityId]) {
      acc[communityId] = []
    }
    acc[communityId].push(take)
    return acc
  }, {} as Record<string, Take[]>)

  // Sort communities to show parent first, then children
  const sortedCommunityIds = Object.keys(groupedTakes).sort((a, b) => {
    const communityA = takes.find(t => t.community.id === a)?.community
    const communityB = takes.find(t => t.community.id === b)?.community
    if (communityA?.parent && !communityB?.parent) return 1
    if (!communityA?.parent && communityB?.parent) return -1
    return 0
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center space-x-2">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-[200px] animate-pulse rounded bg-muted" />
              <div className="h-4 w-[150px] animate-pulse rounded bg-muted" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Sorting options */}
      <div className="flex space-x-2 border-b border-border pb-2">
        <Button
          variant={sort === 'hot' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleSortChange('hot')}
          className="gap-2"
        >
          <Flame className="h-4 w-4" />
          Hot
        </Button>
        <Button
          variant={sort === 'new' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleSortChange('new')}
          className="gap-2"
        >
          <Clock className="h-4 w-4" />
          New
        </Button>
        <Button
          variant={sort === 'top' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleSortChange('top')}
          className="gap-2"
        >
          <TrendingUp className="h-4 w-4" />
          Top
        </Button>
      </div>

      {/* Takes list */}
      <div className="space-y-6">
        {sortedCommunityIds.map((communityId) => {
          const communityTakes = groupedTakes[communityId]
          const firstTake = communityTakes[0]
          const isChildCommunity = firstTake.community.parent !== null

          return (
            <div key={communityId} className="space-y-4">
              {isChildCommunity && communitySlug && (
                <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
                  <h3 className="text-sm font-medium">
                    Takes from {firstTake.community.name}
                  </h3>
                </div>
              )}
              {communityTakes.map((take) => (
                <TakeCard 
                  key={take.id} 
                  take={take} 
                  currentKultureSlug={communitySlug}
                />
              ))}
            </div>
          )
        })}
        {takes.length === 0 && (
          <div className="rounded-lg border p-8 text-center">
            <h2 className="text-lg font-semibold">No takes yet</h2>
            <p className="text-sm text-muted-foreground">
              Be the first to share a take in this community!
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 