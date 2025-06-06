'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
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

  function vote(type: 'UP' | 'DOWN') {
    if (!session) {
      router.push('/sign-in')
      return
    }

    setIsLoading(true)
    fetch(`/api/takes/${takeId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to vote')
        }
        return response.json()
      })
      .then((data) => {
        setVotes(data.votes)
        // Recalculate vote score
        const newScore = data.votes.reduce((acc: number, vote: Vote) => {
          if (vote.type === 'UP') return acc + 1
          if (vote.type === 'DOWN') return acc - 1
          return acc
        }, 0)
        setVoteScore(newScore)
      })
      .catch((error) => {
        toast({
          title: 'Error',
          description: 'Failed to vote. Please try again.',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-6 w-6',
          userVote?.type === 'UP' && 'text-purple-900 dark:text-purple-400'
        )}
        disabled={isLoading}
        onClick={() => vote('UP')}
      >
        <ArrowBigUp className="h-5 w-5" />
      </Button>
      <p className="text-center text-sm font-medium">{voteScore}</p>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          'h-6 w-6',
          userVote?.type === 'DOWN' && 'text-purple-900 dark:text-purple-400'
        )}
        disabled={isLoading}
        onClick={() => vote('DOWN')}
      >
        <ArrowBigDown className="h-5 w-5" />
      </Button>
    </div>
  )
} 