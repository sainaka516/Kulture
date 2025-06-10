'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import SwipeableCard from './SwipeableCard'
import { Button } from './ui/button'
import { Loader2, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react'
import { Take } from '@/lib/types'
import { Card } from './ui/card'
import { useTakes } from '@/lib/contexts/TakesContext'

interface SwipeableTakeFeedProps {
  initialTakes: Take[]
  communityId?: string
  communitySlug: string | null
  onTakeViewed?: (takeId: string) => void
  onVote?: (takeId: string, type: 'UP' | 'DOWN') => Promise<void>
}

export default function SwipeableTakeFeed({
  initialTakes,
  communityId,
  communitySlug,
  onTakeViewed,
  onVote,
}: SwipeableTakeFeedProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const { takes } = useTakes()
  const [viewedTakes, setViewedTakes] = useState<Take[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showNoMoreTakes, setShowNoMoreTakes] = useState(false)

  const handleNext = useCallback(() => {
    const currentTake = takes[currentIndex]
    if (!currentTake) return

    // Mark current take as viewed before moving to next
    if (onTakeViewed) {
      onTakeViewed(currentTake.id)
    }

    // If we're at the last take, show the no more takes message
    if (currentIndex >= takes.length - 1) {
      setShowNoMoreTakes(true)
      return
    }

    // Otherwise, advance to the next take
    setCurrentIndex(prevIndex => prevIndex + 1)
    setShowNoMoreTakes(false)
  }, [currentIndex, takes, onTakeViewed])

  const handlePrevious = useCallback(() => {
    if (!communitySlug) {
      // In explore mode
      if (viewedTakes.length > 0) {
        const previousTake = viewedTakes[0]
        setViewedTakes(prev => prev.slice(1))
        setCurrentIndex(0)
      } else {
        toast({
          title: 'No previous takes',
          description: 'You\'re at the beginning of your feed!',
        })
      }
    } else {
      // In community mode, just decrement the index if possible
      if (currentIndex > 0) {
        setCurrentIndex(prevIndex => prevIndex - 1)
        setShowNoMoreTakes(false)
      } else {
        toast({
          title: 'First take',
          description: 'You\'re at the first take!',
        })
      }
    }
  }, [currentIndex, communitySlug, viewedTakes, toast])

  const handleVote = useCallback(async (type: 'UP' | 'DOWN') => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to vote.',
        variant: 'destructive',
      })
      return
    }

    const currentTake = takes[currentIndex]
    if (!currentTake || !onVote) {
      return
    }

    try {
      await onVote(currentTake.id, type)
    } catch (error) {
      console.error('Error voting:', error)
      toast({
        title: 'Error',
        description: 'Failed to vote. Please try again.',
        variant: 'destructive',
      })
    }
  }, [currentIndex, takes, session, onVote, toast])

  // Reset current index when takes change
  useEffect(() => {
    // Only reset if we're not at the last take
    if (currentIndex >= takes.length) {
      setCurrentIndex(takes.length - 1)
    }
    // Reset showNoMoreTakes when takes change
    setShowNoMoreTakes(false)
  }, [takes, currentIndex])

  if (!takes.length) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No takes available. Check back later!</p>
      </div>
    )
  }

  const currentTake = takes[currentIndex]
  const hasPrevious = !communitySlug ? viewedTakes.length > 0 : currentIndex > 0
  const isLastTake = currentIndex === takes.length - 1

  return (
    <div className="relative">
      {currentTake && (
        <SwipeableCard
          take={currentTake}
          currentKultureSlug={communitySlug}
          onVote={handleVote}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasPrevious={hasPrevious}
          isLastTake={isLastTake}
        />
      )}
      {showNoMoreTakes && (
        <div className="text-center mt-6">
          <p className="text-muted-foreground">No more takes available. Check back later!</p>
          {currentIndex > 0 && (
            <button
              onClick={() => {
                setCurrentIndex(0)
                setShowNoMoreTakes(false)
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Back to first take
            </button>
          )}
        </div>
      )}
    </div>
  )
} 