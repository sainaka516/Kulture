'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import SwipeableCard from './SwipeableCard'
import { Button } from './ui/button'
import { Loader2, RefreshCw, ChevronRight, ChevronLeft } from 'lucide-react'
import { Take } from '@/lib/types'

interface SwipeableTakeFeedProps {
  initialTakes: Take[]
  communityId?: string
  communitySlug: string | null
  onTakeViewed?: (takeId: string) => void
}

export default function SwipeableTakeFeed({
  initialTakes,
  communityId,
  communitySlug,
  onTakeViewed,
}: SwipeableTakeFeedProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [takes, setTakes] = useState<Take[]>([])
  const [viewedTakes, setViewedTakes] = useState<Take[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    console.log('SwipeableTakeFeed initializing with:', {
      communityId,
      communitySlug,
      initialTakesCount: initialTakes?.length,
      initialTakes: initialTakes?.map(take => ({
        id: take.id,
        title: take.title,
        community: {
          name: take.community.name,
          parent: take.community.parent?.name
        }
      }))
    })
    
    if (initialTakes?.length) {
      setTakes(initialTakes)
      console.log('Setting initial takes:', initialTakes)
    }
  }, [initialTakes, communityId, communitySlug])

  const currentTake = takes[currentIndex]

  console.log('SwipeableTakeFeed rendered with:', { 
    takesCount: takes?.length,
    currentTakeIndex: currentIndex,
    communityId,
    communitySlug,
    currentTake: currentTake ? {
      id: currentTake.id,
      title: currentTake.title,
      communityName: currentTake.community.name,
      parentCommunityName: currentTake.community.parent?.name,
      votes: currentTake.votes.length,
      memberCount: currentTake.community._count?.members,
      parentMemberCount: currentTake.community.parent?._count?.members
    } : null
  })

  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to vote.',
        variant: 'destructive',
      })
      return
    }

    if (!currentTake) {
      return
    }

    try {
      const response = await fetch(`/api/takes/${currentTake.id}/vote`, {
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

      setTakes(prev =>
        prev.map(take =>
          take.id === updatedTake.id ? updatedTake : take
        )
      )

      // Only show success message if the vote was added or changed
      const existingVote = currentTake.votes.find(v => v.userId === session.user.id)?.type
      const isRemovingVote = existingVote === type
      if (!isRemovingVote) {
        toast({
          title: 'Success',
          description: `You ${type === 'UP' ? 'agreed with' : 'disagreed with'} this take`,
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to vote. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleNext = useCallback(() => {
    console.log('handleNext called', { currentIndex, totalTakes: takes.length })
    
    if (!currentTake) return

    // Mark current take as viewed before moving to next
    if (onTakeViewed) {
      onTakeViewed(currentTake.id)
    }

    if (!communitySlug) {
      // In explore mode, move the current take to viewedTakes
      setViewedTakes(prev => [currentTake, ...prev]) // Add to start of viewed takes
      setTakes(prev => prev.filter((_, index) => index !== currentIndex))
    } else {
      // In community mode, just increment the index
      setCurrentIndex(prevIndex => prevIndex + 1)
    }
  }, [currentIndex, takes.length, communitySlug, onTakeViewed, currentTake])

  const handlePrevious = useCallback(() => {
    console.log('handlePrevious called', { currentIndex, viewedTakes, takes })
    
    if (!communitySlug) {
      // In explore mode
      if (viewedTakes.length > 0) {
        const previousTake = viewedTakes[0] // Get most recently viewed take
        console.log('Restoring take:', previousTake)
        setViewedTakes(prev => prev.slice(1)) // Remove from viewed takes
        setTakes(prev => [previousTake, ...prev]) // Add to start of current takes
        setCurrentIndex(0) // Ensure we're viewing the restored take
      } else {
        console.log('No previous takes available')
        toast({
          title: 'No previous takes',
          description: 'You\'re at the beginning of your feed!',
        })
      }
    } else {
      // In community mode, just decrement the index if possible
      if (currentIndex > 0) {
        setCurrentIndex(prevIndex => prevIndex - 1)
      } else {
        toast({
          title: 'First take',
          description: 'You\'re at the first take!',
        })
      }
    }
  }, [currentIndex, communitySlug, viewedTakes, takes, toast])

  const handleManualNext = () => {
    handleNext()
  }

  const handleManualPrevious = () => {
    handlePrevious()
  }

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

  // Add debug logging for state changes
  useEffect(() => {
    console.log('State updated:', {
      takesCount: takes.length,
      viewedTakesCount: viewedTakes.length,
      currentIndex,
      currentTakeId: currentTake?.id
    })
  }, [takes, viewedTakes, currentIndex, currentTake])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[500px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!takes || (takes.length === 0 && viewedTakes.length === 0)) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-2">No more takes to see!</h2>
        <p className="text-muted-foreground mb-4">
          You've seen all the takes for now. Check back later for new ones!
        </p>
        <Button onClick={fetchTakes} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Takes
        </Button>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Navigation buttons */}
      <div className="flex justify-center items-center gap-4 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualPrevious}
          disabled={!communitySlug ? viewedTakes.length === 0 : currentIndex === 0}
          className="flex items-center gap-1 hover:bg-accent hover:text-accent-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleManualNext}
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
    </div>
  )
} 