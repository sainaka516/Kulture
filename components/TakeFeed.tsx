'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/hooks/use-toast'
import { useTakes } from '@/lib/contexts/TakesContext'
import { Take, Vote } from '@/lib/types'
import SwipeableTakeFeed from './SwipeableTakeFeed'
import TakeCard from '@/components/TakeCard'
import { cn } from '@/lib/utils'

interface TakeFeedProps {
  takes: Take[]
  currentKultureSlug?: string | null
  defaultView?: 'swipe' | 'list'
  showViewSwitcher?: boolean
  showDeleteButton?: boolean
  onDelete?: (takeId: string) => void
  onVote?: (takeId: string, voteType: 'UP' | 'DOWN') => Promise<void>
}

interface UpdatedTake extends Take {
  votes: Vote[]
}

export default function TakeFeed({ takes, currentKultureSlug, defaultView = 'swipe', showViewSwitcher = false, showDeleteButton = false, onDelete, onVote: externalOnVote }: TakeFeedProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { updateTake, takes: contextTakes } = useTakes()
  
  // Use view switcher if enabled, otherwise always use swipe view
  const [view, setView] = useState<'swipe' | 'list'>(defaultView)
  const shouldShowViewSwitcher = showViewSwitcher

  // Force using context takes if available, otherwise fall back to props
  const currentTakes = (contextTakes && contextTakes.length > 0) ? contextTakes : (takes || [])
  
  // Debug logging
  console.log('TakeFeed Debug:', {
    contextTakesLength: contextTakes?.length || 0,
    propsTakesLength: takes?.length || 0,
    currentTakesLength: currentTakes?.length || 0,
    usingContext: contextTakes && contextTakes.length > 0,
    contextTakes: contextTakes?.map(t => ({ id: t.id, votes: t.votes?.length || 0, userVote: t.userVote })) || []
  })



  const handleVote = async (takeId: string, voteType: 'UP' | 'DOWN') => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to vote on takes.',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // If external vote handler is provided, use it
      if (externalOnVote) {
        await externalOnVote(takeId, voteType)
        return
      }

      // Otherwise, use the default voting logic
      const response = await fetch(`/api/takes/${takeId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: voteType }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const updatedTake = await response.json() as UpdatedTake

      // Update the take in the context
      const transformedTake = {
        ...updatedTake,
        _count: {
          ...updatedTake._count || {},
          upvotes: updatedTake.votes.filter((v: Vote) => v.type === 'UP').length,
          downvotes: updatedTake.votes.filter((v: Vote) => v.type === 'DOWN').length,
        },
        userVote: updatedTake.votes.find((v: Vote) => v.userId === session.user.id)?.type || null,
      };

      // Update the take in context if updateTake function exists
      if (updateTake) {
        updateTake(transformedTake);
      }

      // Only show success message if the vote was added or changed
      const existingTake = currentTakes.find((take: Take) => take.id === takeId)
      const existingVote = existingTake?.votes.find((vote: Vote) => vote.userId === session.user.id)?.type
      const isRemovingVote = existingVote === voteType
      if (!isRemovingVote) {
        toast({
          title: 'Success',
          description: `You ${voteType === 'UP' ? 'agreed with' : 'disagreed with'} this take`,
        })
      }

      // Broadcast the vote update to other tabs/windows
      const broadcastChannel = new BroadcastChannel('vote-updates')
      broadcastChannel.postMessage({
        takeId: updatedTake.id,
        updatedTake: {
          ...updatedTake,
          _count: {
            ...updatedTake._count || {},
            upvotes: updatedTake.votes.filter((v: Vote) => v.type === 'UP').length,
            downvotes: updatedTake.votes.filter((v: Vote) => v.type === 'DOWN').length,
          },
          userVote: updatedTake.votes.find((v: Vote) => v.userId === session.user.id)?.type || null,
        }
      })
    } catch (error) {
      console.error('Failed to vote:', error)
      toast({
        title: 'Error',
        description: 'Failed to vote on take.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {shouldShowViewSwitcher && (
        <div className="flex justify-end">
          <div className="inline-flex rounded-lg border p-1">
            <button
              className={cn(
                'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:bg-muted',
                view === 'list' && 'bg-muted'
              )}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              className={cn(
                'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-all hover:bg-muted',
                view === 'swipe' && 'bg-muted'
              )}
              onClick={() => setView('swipe')}
            >
              Swipe
            </button>
          </div>
        </div>
      )}
      {view === 'swipe' ? (
        <SwipeableTakeFeed
          initialTakes={currentTakes}
          takes={currentTakes}
          communitySlug={currentKultureSlug || null}
          onVote={handleVote}
          showDeleteButton={showDeleteButton}
          onDelete={onDelete}
        />
      ) : (
        <div className="grid gap-4">
          {currentTakes.map((take: Take) => (
            <TakeCard
              key={take.id}
              take={take}
              currentKultureSlug={currentKultureSlug}
              onVote={handleVote}
              showDeleteButton={showDeleteButton}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
} 