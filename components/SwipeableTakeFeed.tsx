'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import SwipeableCard from './SwipeableCard'
import { Button } from './ui/button'
import { Loader2, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react'
import { Take } from '@/lib/types'
import { Card } from './ui/card'

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
  const [takes, setTakes] = useState<Take[]>([])
  const [viewedTakes, setViewedTakes] = useState<Take[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNoMoreTakes, setShowNoMoreTakes] = useState(false)

  // Update takes when initialTakes changes (including vote updates)
  useEffect(() => {
    if (communitySlug) {
      // In community mode, just update all takes
      setTakes(initialTakes)
    } else {
      // In explore mode, only update takes that haven't been viewed
      const viewedTakeIds = new Set(viewedTakes.map(t => t.id))
      setTakes(prev => {
        // Keep the order of existing takes but update their data
        return prev.map(take => {
          const updatedTake = initialTakes.find(t => t.id === take.id)
          return updatedTake || take
        })
      })
    }
  }, [initialTakes, communitySlug, viewedTakes])

  // Initialize takes on mount
  useEffect(() => {
    setTakes(initialTakes)
  }, [initialTakes])

  const handleNext = useCallback(() => {
    const currentTake = takes[currentIndex]
    if (!currentTake) return

    // Mark current take as viewed before moving to next
    if (onTakeViewed) {
      onTakeViewed(currentTake.id)
    }

    if (!communitySlug) {
      // In explore mode, move the current take to viewedTakes
      setViewedTakes(prev => [currentTake, ...prev])
      setTakes(prev => prev.filter((_, index) => index !== currentIndex))
    } else {
      // In community mode, just increment the index if there are more takes
      if (currentIndex < takes.length - 1) {
        setCurrentIndex(prevIndex => prevIndex + 1)
      } else {
        setShowNoMoreTakes(true)
      }
    }
  }, [currentIndex, takes, communitySlug, onTakeViewed])

  const handlePrevious = useCallback(() => {
    if (!communitySlug) {
      // In explore mode
      if (viewedTakes.length > 0) {
        const previousTake = viewedTakes[0]
        setViewedTakes(prev => prev.slice(1))
        setTakes(prev => [previousTake, ...prev])
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

  const fetchTakes = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        communitySlug
          ? `/api/k/${communitySlug}/takes`
          : `/api/takes`
      )
      
      if (!response.ok) {
        throw new Error('Failed to fetch takes')
      }
      
      const data = await response.json()
      console.log('Fetched takes:', data)
      setTakes(data.takes)
      setViewedTakes([])
      setCurrentIndex(0)
    } catch (error) {
      console.error('Error fetching takes:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch takes. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [communitySlug, toast])

  useEffect(() => {
    console.log('SwipeableTakeFeed initializing with:', {
      communityId,
      communitySlug,
      initialTakesCount: initialTakes?.length,
      initialTakes: initialTakes?.map(take => ({
        id: take.id,
        title: take.title,
        community: take.community ? {
          name: take.community?.name,
          parent: take.community?.parent?.name
        } : null
      }))
    })
    
    if (initialTakes?.length) {
      // Validate takes have required data
      const validTakes = initialTakes.filter(take => {
        if (!take.community) {
          console.error('Take missing community data:', take)
          return false
        }
        if (!take.community.name) {
          console.error('Take community missing name:', take)
          return false
        }
        return true
      })

      if (validTakes.length !== initialTakes.length) {
        console.error('Some takes were filtered out due to missing data')
        setError('Some takes have invalid data')
      }

      setTakes(validTakes)
      console.log('Setting initial takes:', validTakes)
    }
  }, [initialTakes, communityId, communitySlug])

  // Get current take after all hooks are defined
  const currentTake = takes[currentIndex]

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  // Render empty state
  if (!takes.length) {
    return (
      <div className="text-center py-6">
        <p className="text-muted-foreground">No more takes to show!</p>
      </div>
    )
  }

  // Render error state for missing community data
  if (currentTake && !currentTake.community) {
    console.error('Take found but missing community data:', currentTake)
    return (
      <div className="text-center py-6">
        <p className="text-red-500">Error: Take is missing community data</p>
      </div>
    )
  }

  // Log current state
  console.log('SwipeableTakeFeed rendered with:', { 
    takesCount: takes?.length,
    currentTakeIndex: currentIndex,
    communityId,
    communitySlug,
    currentTake: currentTake && currentTake.community ? {
      id: currentTake.id,
      title: currentTake.title,
      communityName: currentTake.community?.name,
      parentCommunityName: currentTake.community?.parent?.name,
      votes: currentTake.votes?.length || 0,
      memberCount: currentTake.community?._count?.members,
      parentMemberCount: currentTake.community?.parent?._count?.members
    } : null
  })

  // Render main component
  return (
    <div className="relative">
      {/* Navigation buttons */}
      <div className="flex justify-center items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePrevious}
          disabled={!communitySlug ? viewedTakes.length === 0 : currentIndex === 0}
          className="flex items-center gap-1 hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNext}
          disabled={takes.length === 0}
          className="flex items-center gap-1 hover:bg-accent hover:text-accent-foreground"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Swipeable card container with fixed height */}
      <div className="relative h-[85vh] mt-2">
        {currentTake && (
          <SwipeableCard
            key={currentTake.id}
            take={currentTake}
            currentKultureSlug={communitySlug}
            onVote={handleVote}
            onNext={handleNext}
            onPrevious={handlePrevious}
            hasPrevious={!communitySlug ? viewedTakes.length > 0 : currentIndex > 0}
          />
        )}
      </div>

      {/* Refresh button */}
      <div className="flex justify-center mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchTakes}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Takes
        </Button>
      </div>

      {/* No more takes overlay */}
      {showNoMoreTakes && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg backdrop-blur-sm">
          <Card className="p-6 text-center bg-background/95 shadow-xl max-w-sm mx-4">
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-muted-foreground mb-4">
              You've seen all the takes in this Kulture. Check back later for new ones!
            </p>
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setShowNoMoreTakes(false)}
              >
                Keep Browsing
              </Button>
              {currentIndex > 0 && (
                <Button
                  variant="default"
                  onClick={() => {
                    setCurrentIndex(0)
                    setShowNoMoreTakes(false)
                  }}
                >
                  Start Over
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
} 