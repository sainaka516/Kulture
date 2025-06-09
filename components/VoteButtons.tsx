'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface VoteButtonsProps {
  takeId: string;
  userVote: 'UP' | 'DOWN' | null;
  upvotes: number;
  downvotes: number;
  onVote?: (takeId: string, type: 'UP' | 'DOWN') => Promise<void>;
}

export default function VoteButtons({
  takeId,
  userVote,
  upvotes,
  downvotes,
  onVote,
}: VoteButtonsProps) {
  const { data: session } = useSession()
  const { toast } = useToast()

  const handleVote = async (type: 'UP' | 'DOWN') => {
    if (!session) {
      toast({
        title: 'Sign in required',
        description: 'You must be signed in to vote.',
        variant: 'destructive',
      })
      return
    }

    if (!onVote) return

    try {
      await onVote(takeId, type)
    } catch (error) {
      console.error('Error voting:', error)
      toast({
        title: 'Error',
        description: 'Failed to vote. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant={userVote === 'UP' ? 'default' : 'outline'}
        size="icon"
        className={cn(
          "h-8 w-8 transition-colors",
          userVote === 'UP' && "bg-purple-500 hover:bg-purple-600 text-white"
        )}
        onClick={() => handleVote('UP')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M7 10v12" />
          <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z" />
        </svg>
      </Button>
      <span className="text-sm font-medium">{upvotes - downvotes}</span>
      <Button
        variant={userVote === 'DOWN' ? 'default' : 'outline'}
        size="icon"
        className={cn(
          "h-8 w-8 transition-colors",
          userVote === 'DOWN' && "bg-red-500 hover:bg-red-600 text-white"
        )}
        onClick={() => handleVote('DOWN')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="M17 14V2" />
          <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z" />
        </svg>
      </Button>
    </div>
  )
} 