'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface Vote {
  type: 'UP' | 'DOWN'
  userId: string
}

interface VoteButtonsProps {
  takeId: string
  initialVotes: Vote[]
  initialVoteScore: number
  className?: string
}

export default function VoteButtons({
  takeId,
  initialVotes = [],
  initialVoteScore = 0,
  className,
}: VoteButtonsProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [votes, setVotes] = useState<Vote[]>(initialVotes)
  const [voteScore, setVoteScore] = useState(initialVoteScore)
  const [isLoading, setIsLoading] = useState(false)

  // Get the user's current vote if they have voted
  const userVote = session?.user
    ? votes.find((vote) => vote.userId === session.user.id)
    : null

  async function vote(type: 'UP' | 'DOWN') {
    if (!session) {
      router.push('/sign-in')
      return
    }

    if (isLoading) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/takes/${takeId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })

      if (!response.ok) {
        throw new Error('Failed to vote')
      }

      const data = await response.json()
      setVotes(data.votes)

      // Recalculate vote score
      const newScore = data.votes.reduce((acc: number, vote: Vote) => {
        if (vote.type === 'UP') return acc + 1
        if (vote.type === 'DOWN') return acc - 1
        return acc
      }, 0)
      setVoteScore(newScore)

      // Create notification for the take's author
      const isRemovingVote = userVote?.type === type
      if (!isRemovingVote) {
        try {
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: type === 'UP' ? 'TAKE_UPVOTED' : 'TAKE_DOWNVOTED',
              takeId: takeId,
            }),
          })
        } catch (error) {
          console.error('Error creating vote notification:', error)
        }

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
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          vote('UP')
        }}
        className={cn(
          'flex items-center gap-2',
          userVote?.type === 'UP' && 'bg-purple-600 hover:bg-purple-700 text-white'
        )}
        disabled={isLoading}
      >
        <ThumbsUp className="h-4 w-4" />
        <span>{votes.filter(vote => vote.type === 'UP').length}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.stopPropagation()
          vote('DOWN')
        }}
        className={cn(
          'flex items-center gap-2',
          userVote?.type === 'DOWN' && 'bg-red-600 hover:bg-red-700 text-white'
        )}
        disabled={isLoading}
      >
        <ThumbsDown className="h-4 w-4" />
        <span>{votes.filter(vote => vote.type === 'DOWN').length}</span>
      </Button>
    </div>
  )
} 