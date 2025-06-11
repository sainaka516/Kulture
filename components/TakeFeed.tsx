'use client'

import { useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useTakes } from '@/lib/contexts/TakesContext'
import { Take, Vote } from '@/lib/types'
import SwipeableTakeFeed from './SwipeableTakeFeed'
import TakeCard from '@/components/TakeCard'

interface TakeFeedProps {
  takes: Take[]
  currentKultureSlug?: string | null
  defaultView?: 'swipe' | 'list'
  showViewSwitcher?: boolean
}

interface UpdatedTake extends Take {
  votes: Vote[]
}

export default function TakeFeed({ takes, currentKultureSlug, defaultView = 'list', showViewSwitcher = false }: TakeFeedProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { updateTake } = useTakes()
  const [view, setView] = useState<'swipe' | 'list'>(defaultView)

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

      const data = await response.json()
      const updatedTake = data.take as UpdatedTake

      // Update the take in the context
      const transformedTake = {
        ...updatedTake,
        _count: {
          ...updatedTake._count,
          upvotes: updatedTake.votes.filter((v: Vote) => v.type === 'UP').length,
          downvotes: updatedTake.votes.filter((v: Vote) => v.type === 'DOWN').length,
        },
        userVote: updatedTake.votes.find((v: Vote) => v.userId === session.user.id)?.type || null,
      };

      // Only show success message if the vote was added or changed
      const existingTake = takes.find((take: Take) => take.id === takeId)
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
            ...updatedTake._count,
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
      {showViewSwitcher && (
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
          initialTakes={takes}
          communitySlug={currentKultureSlug}
          onVote={handleVote}
        />
      ) : (
        <div className="grid gap-4">
          {takes.map((take: Take) => (
            <TakeCard
              key={take.id}
              take={take}
              currentKultureSlug={currentKultureSlug}
              onVote={handleVote}
            />
          ))}
        </div>
      )}
    </div>
  )
} 