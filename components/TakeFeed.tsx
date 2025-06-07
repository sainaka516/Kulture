'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import SwipeableTakeFeed from './SwipeableTakeFeed'
import TakeCard from '@/components/TakeCard'
import { Take } from '@/lib/types'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TakeFeedProps {
  initialTakes: Take[]
  communityId?: string
  communitySlug: string | null
  onTakeViewed?: (takeId: string) => void
}

export default function TakeFeed({
  initialTakes = [],
  communityId,
  communitySlug,
  onTakeViewed,
}: TakeFeedProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') || 'swipe'

  const [takes, setTakes] = useState<Take[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setTakes(initialTakes)
    setIsLoading(false)
  }, [initialTakes])

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
        setTakes(prev => prev.filter(take => take.id !== takeId))
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!takes.length) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No takes available. Check back later!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Only show view switching buttons on kulture pages */}
      {communitySlug && (
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

      {/* Always use swipe view on explore page, otherwise respect the view preference */}
      {!communitySlug || view === 'swipe' ? (
        <SwipeableTakeFeed
          initialTakes={takes}
          communityId={communityId}
          communitySlug={communitySlug}
          onTakeViewed={handleTakeViewed}
        />
      ) : (
        <div className="space-y-4">
          {takes.map((take) => (
            <TakeCard
              key={take.id}
              take={take}
              currentKultureSlug={communitySlug}
              onViewed={() => handleTakeViewed(take.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
} 