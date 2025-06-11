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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showNoMoreTakes, setShowNoMoreTakes] = useState(false)

  // Use initialTakes if provided, otherwise use takes from context
  const currentTakes = initialTakes || takes

  const handlePrevious = useCallback(() => {
    if (!communitySlug) {
      // In explore mode, just decrement the index if possible
      if (currentIndex > 0) {
        setCurrentIndex(prevIndex => prevIndex - 1)
        setShowNoMoreTakes(false)
      } else {
        toast({
          title: 'First take',
          description: 'You\'re at the first take!',
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
  }, [currentIndex, communitySlug, toast])

  const handleNext = useCallback(() => {
    const currentTake = currentTakes[currentIndex]
    if (!currentTake) return

    // Mark current take as viewed before moving to next
    if (onTakeViewed) {
      onTakeViewed(currentTake.id)
    }

    // If we're at the last take, show the no more takes message
    if (currentIndex >= currentTakes.length - 1) {
      setShowNoMoreTakes(true)
      toast({
        title: "End of Takes",
        description: communitySlug 
          ? "You've reached the end of takes in this kulture! Pull down to refresh or go back."
          : "You've reached the end of takes! Pull down to refresh or go back to previous takes.",
        duration: 3000, // Show for 3 seconds
      })
      return
    }

    // Otherwise, advance to the next take
    setCurrentIndex(prevIndex => prevIndex + 1)
    setShowNoMoreTakes(false)
  }, [currentIndex, currentTakes, onTakeViewed, toast, communitySlug])

  const handleVote = useCallback(async (type: 'UP' | 'DOWN') => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to vote.',
        variant: 'destructive',
      })
      return
    }

    const currentTake = currentTakes[currentIndex]
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
  }, [currentIndex, currentTakes, session, onVote, toast])

  // Reset current index when takes change
  useEffect(() => {
    // Only reset if we're not at the last take
    if (currentIndex >= currentTakes.length) {
      setCurrentIndex(currentTakes.length - 1)
    }
    // Reset showNoMoreTakes when takes change
    setShowNoMoreTakes(false)
  }, [currentTakes, currentIndex])

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        handlePrevious()
      } else if (e.key === 'ArrowRight') {
        handleNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrevious, currentIndex])

  if (!currentTakes.length) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No takes available. Check back later!</p>
      </div>
    )
  }

  const currentTake = currentTakes[currentIndex]
  const hasPrevious = !communitySlug ? currentIndex > 0 : true
  const isLastTake = currentIndex === currentTakes.length - 1

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