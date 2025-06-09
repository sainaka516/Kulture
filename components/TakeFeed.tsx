'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import SwipeableTakeFeed from './SwipeableTakeFeed'
import TakeCard from '@/components/TakeCard'
import { Take } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useSession } from 'next-auth/react'

interface TakeFeedProps {
  takes: Take[]
  communityId?: string
  communitySlug: string | null
  onTakeViewed?: (takeId: string) => void
  defaultView?: 'list' | 'swipe'
  showViewSwitcher?: boolean
}

export default function TakeFeed({
  takes = [],
  communityId,
  communitySlug,
  onTakeViewed,
  defaultView = 'list',
  showViewSwitcher = false,
}: TakeFeedProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || defaultView
  const { toast } = useToast()
  const { data: session } = useSession()

  const [localTakes, setLocalTakes] = useState<Take[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setLocalTakes(takes)
    setIsLoading(false)
  }, [takes])

  // Create URLs for each view
  const createViewUrl = (viewType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', viewType)
    return `${pathname}?${params.toString()}`
  }

  // Handle take viewed
  const handleTakeViewed = (takeId: string) => {
    if (onTakeViewed) {
      onTakeViewed(takeId)
      // Remove the viewed take from the list if we're in explore mode
      if (!communitySlug) {
        setLocalTakes(prev => prev.filter(take => take.id !== takeId))
      }
    }
  }

  // Shared vote handler
  const handleVote = async (takeId: string, type: 'UP' | 'DOWN') => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to vote.',
        variant: 'destructive',
      })
      return
    }

    try {
      const response = await fetch(`/api/takes/${takeId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          communityId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const updatedTake = await response.json()

      // Validate the updated take has required data
      if (!updatedTake.community) {
        console.error('Updated take missing community data:', updatedTake)
        toast({
          title: 'Error',
          description: 'Failed to update take. Please try again.',
          variant: 'destructive',
        })
        return
      }

      // Update the take in localTakes
      setLocalTakes(prev =>
        prev.map(take =>
          take.id === updatedTake.id ? updatedTake : take
        )
      )

      // Only show success message if the vote was added or changed
      const existingTake = localTakes.find(t => t.id === takeId)
      const existingVote = existingTake?.votes.find(v => v.userId === session.user.id)?.type
      const isRemovingVote = existingVote === type
      if (!isRemovingVote) {
        toast({
          title: 'Success',
          description: `You ${type === 'UP' ? 'agreed with' : 'disagreed with'} this take`,
        })
      }
    } catch (error) {
      console.error('Error voting:', error)
      toast({
        title: 'Error',
        description: 'Failed to vote. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!localTakes.length) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No takes available. Check back later!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Show view switching buttons if enabled */}
      {showViewSwitcher && (
        <div className="flex justify-center gap-2 mb-6">
          <Link
            href={createViewUrl('swipe')}
            className={cn(
              "px-4 py-2 rounded-md font-medium transition-colors",
              view === 'swipe'
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            )}
          >
            Swipe View
          </Link>
          <Link
            href={createViewUrl('list')}
            className={cn(
              "px-4 py-2 rounded-md font-medium transition-colors",
              view === 'list'
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            )}
          >
            List View
          </Link>
        </div>
      )}

      {/* Show appropriate view based on preference */}
      {view === 'swipe' ? (
        <SwipeableTakeFeed
          initialTakes={localTakes}
          communityId={communityId}
          communitySlug={communitySlug}
          onTakeViewed={handleTakeViewed}
          onVote={handleVote}
        />
      ) : (
        <div className="space-y-4">
          {localTakes.map((take) => (
            <TakeCard
              key={take.id}
              take={take}
              currentKultureSlug={communitySlug}
              onViewed={() => handleTakeViewed(take.id)}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  )
} 